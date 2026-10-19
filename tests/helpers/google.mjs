import worker from "../../worker/index.mjs";
export const origin="https://smcuc.alphazonelabs.com";
export const authVars={AUTH_ORIGIN:origin,AUTH_PEPPER:"test-pepper",TURNSTILE_SITE_KEY:"test-key",TURNSTILE_SECRET_KEY:"test-secret",GOOGLE_CLIENT_ID:"test-client",GOOGLE_CLIENT_SECRET:"test-client-secret"};
export const authRequest=(route,body,cookie="")=>new Request(`${origin}/api/portal/auth/${route}`,{
  ...(body===undefined?{}:{method:"POST",body:JSON.stringify(body)}),
  headers:{Origin:origin,"Content-Type":"application/json",Cookie:cookie},
});
export const cookies=response=>response.headers.getSetCookie().map(s=>s.split(";")[0]).join("; ");
export async function withGoogle(env,identity,run) {
  const original=globalThis.fetch;
  const pair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const jwk={...await crypto.subtle.exportKey("jwk",pair.publicKey),kid:"test-key",use:"sig"};
  let nonce;
  const mails=[];
  const encode=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
  globalThis.fetch=async(url,options)=>{
    if(url.includes("siteverify"))return Response.json({success:true,hostname:"smcuc.alphazonelabs.com",action:"patient_auth"});
    if(url==="https://api.resend.com/emails"){mails.push(JSON.parse(options.body));return Response.json({id:"test-email"});}
    if(url==="https://www.googleapis.com/oauth2/v3/certs")return Response.json({keys:[jwk]});
    if(url!=="https://oauth2.googleapis.com/token")throw Error("Unexpected provider URL");
    const input=encode({alg:"RS256",kid:"test-key"})+"."+encode({iss:"https://accounts.google.com",aud:env.GOOGLE_CLIENT_ID,exp:Math.floor(Date.now()/1000)+600,iat:Math.floor(Date.now()/1000),nonce,email_verified:true,...identity});
    const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",pair.privateKey,new TextEncoder().encode(input));
    return Response.json({id_token:input+"."+Buffer.from(signature).toString("base64url")});
  };
  const callback=async()=>{
    const start=await worker.fetch(authRequest("google/start",{turnstileToken:"test-token"}),env);
    const redirect=new URL((await start.json()).redirect);nonce=redirect.searchParams.get("nonce");
    return worker.fetch(new Request(`${origin}/api/portal/auth/google/callback?state=${redirect.searchParams.get("state")}&code=test-code`,{headers:{Cookie:cookies(start)}}),env);
  };
  try{return await run({callback,mails});}finally{globalThis.fetch=original;}
}
