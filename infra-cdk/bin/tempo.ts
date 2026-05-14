#!/usr/bin/env node
/**
 * CDK app entry point.
 *
 * Defines the three stacks that compose the production environment:
 *
 *   1. DataStack - VPC, RDS Postgres, secrets
 *   2. AppStack  - ECS cluster, services for Spring API and BFF, ALB
 *   3. WebStack  - S3 bucket, CloudFront distribution for the React app
 *
 * Why three stacks (not one)?
 *   - Lifecycle: WebStack changes a lot (every UI deploy). DataStack barely
 *     changes. Separating them means UI deploys don't risk DB stack instability.
 *   - Permissions: different IAM roles can own different stacks.
 *   - Cross-stack references via exports/imports are fine in small numbers.
 *
 * Why not one stack per service (API, BFF) further?
 *   - Tasks share the same ECS cluster, ALB, VPC. Splitting by service would
 *     require painful cross-stack references for every resource.
 */
import { App, Environment } from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack.js';
import { AppStack } from '../lib/app-stack.js';
import { WebStack } from '../lib/web-stack.js';

const app = new App();

// Single production environment for now. Add staging/dev by parameterizing.
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const dataStack = new DataStack(app, 'TempoData', {
  env,
  description: 'VPC, RDS Postgres, secrets for Tempo',
});

const appStack = new AppStack(app, 'TempoApp', {
  env,
  description: 'ECS services and ALB for Tempo',
  vpc: dataStack.vpc,
  database: dataStack.database,
  databaseSecret: dataStack.databaseSecret,
});

// WebStack is independent of DataStack - it just needs CloudFront + S3.
new WebStack(app, 'TempoWeb', {
  env,
  description: 'S3 bucket and CloudFront distribution for the React app',
  apiOriginDomain: appStack.albDomainName,
});
