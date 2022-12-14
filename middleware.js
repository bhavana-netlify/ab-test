import { NextResponse } from "next/server";

const abCookieName = Deno.env.get("AB_COOKIE_NAME");
const testBuckets = JSON.parse(Deno.env.get("AB_TEST_BUCKETS") || "null");

export const middleware = async (nextRequest) => {
  try {
    const pathname = nextRequest.nextUrl.pathname;
    const origin = nextRequest.nextUrl.origin;

    const response = NextResponse.next();

    const check = nextRequest.nextUrl.searchParams.get("check");

    if (check) {
      return response;
    }

    //If environment variable not set return standard page
    if (!testBuckets || !abCookieName) {
      return response;
    }

    let totalWeighting = testBuckets.reduce(
      (tot, bucket) => tot + bucket.weighting,
      0
    );
    let weightingMultiplier = totalWeighting == 1 ? 1 : 1 / totalWeighting;

    const getBucket = () => {
      let newBucket;
      let randomNumber = Math.random();
      let totalWeighting = 0;

      testBuckets.forEach((b) => {
        if (
          totalWeighting <= randomNumber &&
          randomNumber <= totalWeighting + b.weighting * weightingMultiplier
        ) {
          newBucket = b.name;
        }
        totalWeighting += b.weighting * weightingMultiplier;
      });

      response.cookies.set(abCookieName, newBucket);

      return newBucket;
    };

    //AB Test cookie setup
    const bucket = nextRequest.cookies.get(abCookieName) || getBucket();

    if (bucket) {
      //Check path
      if (pathname.startsWith("/_next")) return response;

      let path = `${origin}/${bucket}${pathname}`;
      console.log(path);

      const res = await fetch(`${path}?check=true`, { method: "HEAD" });

      if (res.status < 400) {
        console.log("Path Found");
        return NextResponse.rewrite(path);
      } else {
        console.log("Path not found");
      }
    }

    return response;
  } catch (error) {
    console.log(error);
  }
};
