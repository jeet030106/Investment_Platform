
import { UserRepository } from "../repository/index.js";

// -- Step 8 --
// Create a Service class, this will contain the business logic of the function.
// From here we call out the functions written in the repositories
class UserService {
    private repository = new UserRepository();

    async getUser(userId: string) {
        return this.repository.getUser(userId);
    }

    async create(input: {
        user_name: string;
        email: string;
        password: string;
    }) {
        const email = input.email.trim().toLowerCase();

        const existingUser =
            await this.repository.getUserByEmail(email);

        if (existingUser) {
            const error = new Error("Email is already registered.");
            Object.assign(error, { statusCode: 409 });
            throw error;
        }

        return this.repository.create({
            ...input,
            email,
            user_name: input.user_name.trim(),
        });
    }
}

export default UserService;
