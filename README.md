## Running instructions:
```
npm i
docker-compose up -d
npm run init // This initializes the necesery resources and adds the test file so you don't need to do anything
npm run dev
```

After running `npm run dev` the file should be processed and the results should be in the a table `process.env.TABLE_NAME` in DynamoDB
