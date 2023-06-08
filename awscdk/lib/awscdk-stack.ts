import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { Construct } from 'constructs';
import { CloudFrontWebDistribution, ViewerProtocolPolicy, AllowedMethods, Behavior } from 'aws-cdk-lib/aws-cloudfront';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const existingUser = iam.User.fromUserName(this, 'ExistingUser', 'epamawsuser');

    // Create an S3 bucket for hosting the website
    const websiteBucket = new s3.Bucket(this, 'KlocekBucket', {
      websiteIndexDocument: 'index.html',
      //publicReadAccess: true, // Allow public read access to the website files
    });

      // Add bucket policy to allow public read access
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [existingUser],
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
      })
    );

    // Deploy the website files to the bucket
    const deployment = new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket: websiteBucket,
    });

    // Create a CloudFront distribution
    const distribution = new CloudFrontWebDistribution(this, 'MyDistribution', {
      originConfigs: [{
        s3OriginSource: {
            s3BucketSource: websiteBucket, 
        },
        behaviors: [{
            isDefaultBehavior: true
        }]
      }]
    });

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
      description: 'URL of the deployed website via CloudFront',
    });
  }
}
