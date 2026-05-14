/**
 * WebStack - static frontend hosting.
 *
 * Architecture:
 *
 *   User -> CloudFront -> S3 (private bucket via Origin Access Control)
 *                     -> ALB (for /api/* and /bff/* paths)
 *
 * Two origins under one distribution:
 *   - Default behavior: serve from S3 (the React SPA)
 *   - Path-based behavior `/api/*`: forward to the ALB (the BFF/Spring API)
 *
 * Why one CloudFront with two origins (not two CloudFronts):
 *   - One ACM cert, one DNS record, one cache key strategy
 *   - Same-origin requests from React, no CORS theater
 *   - Single edge presence for the user
 *
 * Why private S3 + OAC (vs public bucket):
 *   - S3 buckets should never be public unless you really mean it
 *   - OAC (Origin Access Control) lets CloudFront read S3 via signed requests
 *     while the bucket itself denies all public access
 *
 * SPA routing:
 *   React Router uses client-side routing. When the user refreshes on /dashboard,
 *   CloudFront sees a request for an object that doesn't exist in S3. The
 *   errorResponses below rewrite that to / so the SPA can handle routing itself.
 */
import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface WebStackProps extends StackProps {
  /** ALB DNS exported from AppStack - used as the API origin. */
  apiOriginDomain: string;
}

export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'WebBucket', {
      // Private. No public access. CloudFront reads it via OAC.
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      // For dev/throwaway stacks; for real prod use RETAIN to avoid deleting build artifacts.
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(props.apiOriginDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          // Don't cache API responses at the edge - they're per-user-shaped or
          // have their own cache headers from the BFF.
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          // Forward all headers, query strings, cookies through to the origin.
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        // SPA routing - rewrite 403/404 to index.html so React Router can handle them.
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(0) },
      ],
      // priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // cheaper, NA + EU only
    });

    // Hand out the distribution URL as a stack output for visibility.
    new (require('aws-cdk-lib').CfnOutput)(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for the React app',
    });

    new (require('aws-cdk-lib').CfnOutput)(this, 'WebBucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket - deploy script syncs `web-react/dist/` here',
    });
  }
}
