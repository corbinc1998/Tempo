# Infrastructure (AWS CDK)

TypeScript CDK app that provisions everything Tempo runs on in AWS.

## Stacks

- **TempoData** - VPC, RDS Postgres, secrets
- **TempoApp** - ECS cluster, Fargate services, ALB
- **TempoWeb** - S3 + CloudFront for the React app

## First-time setup

```
# Install CDK CLI globally (one-time)
npm install -g aws-cdk

# Bootstrap your account/region (one-time per account+region)
cd infra-cdk
npm install
cdk bootstrap aws://<account-id>/<region>
```

## Deploy

```
# Preview changes
npm run diff

# Apply
npm run deploy
```

CDK deploys in dependency order: DataStack first, then AppStack (needs the VPC), then WebStack (needs the ALB DNS).

## Cost estimate (rough, us-east-1, May 2026)

- NAT Gateway: ~$32/mo
- RDS db.t4g.micro Multi-AZ: ~$30/mo
- ALB: ~$16/mo + traffic
- Fargate: ~$10-30/mo depending on task hours
- CloudFront + S3: ~$1-5/mo for low traffic
- Secrets Manager: ~$0.40/secret/mo

Total: ~$90-120/mo at low traffic. Most of that is NAT + RDS + ALB - fixed costs that don't scale down. For a hobby project, run nightly destroy/deploy or use a smaller setup.

## Things deliberately left out

- HTTPS on the ALB. Easy to add: pass a `certificate` prop on the ApplicationLoadBalancedFargateService construct and an ACM cert ARN.
- Route53 records. Create a hosted zone manually, then add a CNAME or alias record pointing to the CloudFront distribution.
- WAF. Add `cloudfront.WebAclArn` to the distribution when public traffic warrants it.
- Cross-region replication or backup. Single-region for now.
- Staging environment. Duplicate the app + add a context flag `environment=staging` that influences instance sizes and names.

These are all upgrades, not rewrites - the stack structure supports each addition.

## Cleaning up

```
npm run destroy
```

Note: `deletionProtection: true` on RDS means destroy will fail until you flip that flag manually in the console or in the CDK code. This is on purpose - you don't want to lose the database to a typo.
