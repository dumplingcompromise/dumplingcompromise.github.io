
--the idea and framework
--the code to write to s3

--lambda timing out too quickly
--bucket access to be specified

--how I deployed to lambda
--give cloudformation access


--SAM build
sam build --use-container && sam package --s3-bucket ngoldovsky --output-template-file packaged.yaml

--SAM deploy
sam deploy --template-file ./packaged.yaml --stack-name firstlambdastack --capabilities CAPABILITY_IAM


sam deploy --template-file packaged.yaml --stack-name scndlambdastack --capabilities CAPABILITY_IAM


"API: iam:CreateRole User: ngoldovsky is not authorized to perform: iam:CreateRole on resource: scndlambdastack2-HelloWorldFunctionRole
