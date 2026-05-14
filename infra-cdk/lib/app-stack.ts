/**
 * AppStack - the running services. ECS Fargate + ALB.
 *
 * Layout:
 *   - One ECS cluster
 *   - Two Fargate services: api (Spring) and bff (Node)
 *   - One Application Load Balancer in front, with path-based routing:
 *       /api/*    -> Spring API target group
 *       /bff/*    -> BFF target group
 *       (or all -> BFF, and BFF talks to API internally; both topologies work)
 *
 * Why Fargate not EC2:
 *   - No instances to patch, scale, or pay for during idle
 *   - Per-task billing rounded to the second
 *   - Slightly more expensive per vCPU-hour than EC2 at scale, but ops cost wins
 *     for small teams
 *
 * Why an ALB, not API Gateway:
 *   - ALB is cheaper for steady traffic (REST API Gateway charges per request)
 *   - Supports long-lived connections (SSE), WebSockets natively
 *   - Simpler to reason about - it's just a layer-7 load balancer
 *
 * NOTE: This file currently shows the structure but leaves the actual ContainerImage
 * sources as placeholders. You need to:
 *   1. Push the api-java and bff-node images to ECR (the deploy workflow does this)
 *   2. Reference those repositories here via `ecs.ContainerImage.fromEcrRepository(...)`
 *
 * The first deploy is the hardest. Subsequent deploys just push new images and update
 * the service to pull the new tag.
 */
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AppStackProps extends StackProps {
  vpc: ec2.IVpc;
  database: rds.IDatabaseInstance;
  databaseSecret: secretsmanager.ISecret;
}

export class AppStack extends Stack {
  public readonly albDomainName: string;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

    // Shared log group. In production you might want one per service to make
    // CloudWatch Logs queries scoped, but a single group works fine to start.
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/tempo',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // ---- Spring API service ----------------------------------------------
    // Uses the ApplicationLoadBalancedFargateService construct - the "L3"
    // pattern that combines ALB + target group + service + task definition.
    //
    // Tradeoff: less control than wiring components yourself, but covers 80% of
    // setups. Drop to lower-level constructs when you outgrow it.

    const apiService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ApiService', {
      cluster,
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 2, // start with redundancy in mind
      publicLoadBalancer: true,
      taskImageOptions: {
        // PLACEHOLDER - replace with ECR repository reference once you push.
        // image: ecs.ContainerImage.fromEcrRepository(apiEcrRepo, 'latest'),
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        containerPort: 8080,
        environment: {
          SPRING_PROFILES_ACTIVE: 'prod',
        },
        secrets: {
          // ECS pulls these at task start, never logs the values.
          SPRING_DATASOURCE_USERNAME: ecs.Secret.fromSecretsManager(props.databaseSecret, 'username'),
          SPRING_DATASOURCE_PASSWORD: ecs.Secret.fromSecretsManager(props.databaseSecret, 'password'),
        },
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'api', logGroup }),
      },
      healthCheckGracePeriod: Duration.seconds(60),
    });

    apiService.targetGroup.configureHealthCheck({
      path: '/actuator/health',
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Auto-scaling. Target tracking on CPU is the simplest reasonable policy.
    const apiScaling = apiService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 6,
    });
    apiScaling.scaleOnCpuUtilization('ApiCpu', { targetUtilizationPercent: 60 });

    // Allow API tasks to reach RDS.
    props.database.connections.allowDefaultPortFrom(apiService.service);

    // Expose ALB DNS for cross-stack reference (WebStack uses this as the API origin).
    this.albDomainName = apiService.loadBalancer.loadBalancerDnsName;

    // For a real prod setup, add:
    //   - ACM cert + HTTPS listener (port 443)
    //   - Route53 hosted zone alias to the ALB
    //   - WAF for basic protections
    // Left out here to keep the scaffold focused.

    // ---- BFF service (commented-out skeleton) ----------------------------
    //
    // Once the API service is healthy, uncomment and adapt this for the BFF.
    // The BFF doesn't need its own ALB - share apiService.loadBalancer and
    // route by path or host.
    //
    // const bffService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'BffService', {
    //   cluster,
    //   loadBalancer: apiService.loadBalancer,  // share
    //   memoryLimitMiB: 512,
    //   cpu: 256,
    //   desiredCount: 2,
    //   taskImageOptions: {
    //     image: ecs.ContainerImage.fromEcrRepository(bffEcrRepo, 'latest'),
    //     containerPort: 8081,
    //     environment: {
    //       NODE_ENV: 'production',
    //       SPRING_API_BASE_URL: `http://${apiService.loadBalancer.loadBalancerDnsName}`,
    //     },
    //     logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'bff', logGroup }),
    //   },
    // });
  }
}
