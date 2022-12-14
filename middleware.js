import { MiddlewareRequest } from "@netlify/next";
const abCookieName = JSON.parse(Deno.env.get("AB_COOKIE_NAME") || "null");
const testBuckets = JSON.parse(Deno.env.get("AB_TEST_BUCKETS") || "null");

export const middleware = async (nextRequest) => {
  //If environment variable not set return standard page
  if (!testBuckets || !abCookieName) {
    return nextRequest.next();
  }

  //Ensure weighting adds up
  let totalWeighting = testBuckets.reduce(
    (tot, bucket) => tot + bucket.weighting,
    0
  );
  let weightingMultiplier = totalWeighting == 1 ? 1 : 1 / totalWeighting;

  //AB Test cookie setup
  const bucket = nextRequest.cookies.get(abCookieName) || getBucket();

  const getBucket = () => {
    let newBucket;
    let randomNumber = Math.random();
    let totalWeighting = 0;
    buckets.forEach((b) => {
      if (
        totalWeighting <= randomNumber &&
        randomNumber <= totalWeighting + b.weighting * weightingMultiplier
      ) {
        newBucket = b.name;
      }
      totalWeighting += b.weighting * weightingMultiplier;
    });

    nextRequest.cookies.set(abCookieName, newBucket);
    return newBucket;
  };
  console.log("bucket", bucket);

  if (bucket) {
    //Check path
    let path = `${nextRequest.nextUrl}/${bucket}/${nextRequest.nextUrl.pathname}`;
    console.log(nextRequest);
    //let res = await fetch(path);
    if (res.status < 400) {
      nextRequestRequest.rewrite(path);
    }
  }
};
