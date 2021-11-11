import IUser from "@interfaces/models/User";

declare global {
    namespace Express {
        export interface User extends IUser {}
        export interface Request {
            user?: User;
        }
    }
}
