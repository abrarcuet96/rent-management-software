import { setupServer } from "msw/node";
import { handlers, resetCounters } from "./handlers";

export const server = setupServer(...handlers);

export { resetCounters };