// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage();

// The ID of your GCS bucket
const bucketName = 'demo-buck9'; // <--- Your bucket name

// The origin for this CORS config to allow requests from
const origin = 'http://localhost:3001'; // <--- Your frontend's URL
// If you have a production domain, add it here too:
// const origin = 'http://localhost:3001,https://your-production-domain.com';

// The response header to share across origins (often needed for uploads)
const responseHeader = 'Content-Type';

// The maximum amount of time the browser can make requests before it must
// repeat preflighted requests
const maxAgeSeconds = 3600;

// The name of the method(s) you'll use to upload (PUT for pre-signed URLs)
const method = 'PUT'; // <--- Important: use 'PUT' for uploads

async function configureBucketCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      maxAgeSeconds,
      method: [method], // Use an array for methods
      origin: [origin], // Use an array for origins
      responseHeader: [responseHeader], // Use an array for response headers
    },
  ]);
  console.log(`Bucket ${bucketName} was updated with a CORS config
      to allow ${method} requests from ${origin} sharing
      ${responseHeader} responses across origins`);
}

configureBucketCors().catch(console.error);