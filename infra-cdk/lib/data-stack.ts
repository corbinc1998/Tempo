/**
 * DataStack - the foundation. Network and persistence.
 *
 * What's here:
 *   - VPC with public and private subnets across 2 AZs
 *   - NAT Gateway so private subnets can reach the internet for AWS APIs and
 *     for Spring's outbound calls (rare; mostly health probes)
 *   - RDS Postgres in private subnets, Multi-AZ for failover
 *   - Secret in Secrets Manager holding the DB password and ingest API key
 *
 * What's NOT here:
 *   - Backup configuration beyond defaults - RDS does PITR automatically
 *   - Read replicas - add when read load justifies (see ROADMAP)
 *   - RDS Proxy - add when connection pressure justifies
 *
 * Cost notes:
 *   - NAT Gateway is ~$32/mo per AZ. Use a single NAT for non-prod or NAT Instance
 *     for further savings if you're cost-sensitive.
 *   - db.t4g.micro is the cheapest RDS class that exists; fine for low traffic.
 *   - Multi-AZ doubles the DB cost. Disable for non-prod stacks.
 */
import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class DataStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly database: rds.IDatabaseInstance;
  public readonly databaseSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC with 2 AZs. CDK provisions public + private (egress) subnets in each
    // by default. The "egress" subnet type means private with NAT Gateway access.
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1, // 1 saves cost vs 1-per-AZ; less resilient but acceptable
      subnetConfiguration: [
        { name: 'public',  subnetType: ec2.SubnetType.PUBLIC,           cidrMask: 24 },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'data',    subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Auto-generated DB password stored in Secrets Manager.
    // ECS task can read this at runtime; we never see the value.
    this.databaseSecret = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: 'tempo/db/credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'tempo' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Security group for the database. Only allow inbound from app subnets.
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'RDS Postgres - only ECS tasks',
      allowAllOutbound: false,
    });

    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      databaseName: 'tempo',
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // auto-grow up to this
      multiAz: true,
      backupRetention: Duration.days(7),
      deletionProtection: true,
      // For dev / experimentation set removalPolicy: DESTROY. NEVER in prod.
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
