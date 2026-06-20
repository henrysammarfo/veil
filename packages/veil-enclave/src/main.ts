import "../../sdk/src/load-env.ts";
import { createEnclaveServer } from "./server.js";

const { server, port, enclaveId } = createEnclaveServer({
  port: Number(process.env.VEIL_ENCLAVE_PORT ?? 8080),
});

server.listen(port, () => {
  console.log(`veil-enclave listening :${port} id=${enclaveId.slice(0, 16)}…`);
});
