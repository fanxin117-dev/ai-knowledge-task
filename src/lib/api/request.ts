export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    // JSON 解析失败属于客户端输入问题，交给各 parse 函数按“非对象请求体”返回统一校验错误。
    return undefined;
  }
}
