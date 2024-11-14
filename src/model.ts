import { password } from "bun";
import { Database } from "bun:sqlite";
import { Book, User } from "../types/type";

const db = new Database("mydb.sqlite");

// Function to retrieve all books from the database
export const getBooks = () => {
    try {
        // Executes a SQL query to select all books
        const query = db.query(`SELECT * FROM books;`);
        // Returns the result of the query
        return query.all();
    } catch (error) {
        // Logs an error message if the query fails
        console.error(error);
        return { error: "Failed to retrieve books." };
    }
};

// Function to retrieve a single book by its ID
export const getBook = (id: number) => {
    try {
        // Executes a SQL query to select a book by ID
        const query = db.query(`SELECT * FROM books WHERE id=$id;`);
        // Returns the book record matching the given ID
        return query.get({ $id: id });
    } catch (error) {
        // Logs an error message if the query fails
        console.error(error);
        return { error: "Failed to retrieve book." };
    }
};

// Function to create a new book entry in the database
export const createBook = (book: Omit<Book, "id">) => {
    try {
        // Executes an SQL query to insert a new book with specified details
        const query = db.query(`
            INSERT INTO books ("name", "author", "price")
            VALUES ($name, $author, $price);
        `);
        // Runs the query with book details provided in the arguments
        query.run({
            $name: book.name,
            $author: book.author,
            $price: book.price,
        });
        // Returns a success message upon successful insertion
        return { message: "Book Added!" };
    } catch (error) {
        // Logs an error message if the insertion fails
        console.error(error);
        return { error: "Failed to create book." };
    }
};

// Function to update a book's details in the database
export const updateBook = (id: number, book: Partial<Book>) => {
    try {
        // Retrieves the current book details by ID
        const currentBook = db.query(`SELECT * FROM books WHERE id = $id;`).get({ $id: id }) as Book;
        // If no book is found, throws an error
        if (currentBook === null) throw new Error;

        // Constructs an updated book object, retaining original values if new ones are not provided
        const updatedBook = {
            name: book.name ?? currentBook.name,
            author: book.author ?? currentBook.author,
            price: book.price ?? currentBook.price,
        };

        // Executes an SQL query to update the book's details
        const query = db.query(`
            UPDATE books SET "name" = $name, "author" = $author, "price" = $price
            WHERE id = $id;
        `);
        // Runs the query with updated book data
        query.run({
            $id: id,
            $name: updatedBook.name,
            $author: updatedBook.author,
            $price: updatedBook.price,
        });
        // Returns a success message upon successful update
        return { message: "Book Updated!" };
    } catch (error) {
        // Logs an error message if the update fails
        console.error(error);
        return { error: "Failed to update book." };
    }
};

// Function to delete a book from the database by its ID
export const deleteBook = (id: number) => {
    try {
        // Executes a SQL query to delete the book with the specified ID
        const query = db.query(`DELETE FROM books WHERE id=$id;`);
        const result = query.run({ $id: id });
        // If no rows were deleted, throws an error
        if (result.changes === 0) throw new Error;
        // Returns a success message upon successful deletion
        return { message: "Book Deleted!" };
    } catch (error) {
        // Logs an error message if the deletion fails
        console.error(error);
        return { error: "Failed to delete book." };
    }
};

// Function to create a new user in the database with a hashed password
export const createUser = async (user: User) => {
    try {
        // Hashes the user's password before storing it
        const hashedPassword = await password.hash(user.password);
        // Executes an SQL query to insert a new user with email and hashed password
        const query = db.query(`
            INSERT INTO users ("email", "password")
            VALUES ($email, $password);
        `);
        // Runs the query with the provided user email and hashed password
        query.run({
            $email: user.email,
            $password: hashedPassword,
        });
        // Returns a success message upon successful user creation
        return { message: "User Created!" };
    } catch (error) {
        // Logs an error message if the user creation fails
        console.error(error);
        return { error: "Failed to create user." };
    }
};

// Function to retrieve and authenticate a user by their email and password
export const getUser = async (user: User) => {
    try {
        // Executes a parameterized SQL query to select a user by email, preventing SQL injection
        const query = db.query(`SELECT * FROM users WHERE email = ?;`);
        const dbUser = query.get(user.email) as User | undefined;

        // If no user is found, returns a failure message
        if (!dbUser) return { success: false, message: "User not found" };

        // Verifies the provided password against the stored hashed password
        const isPasswordValid = await password.verify(user.password, dbUser.password);
        // If the password is invalid, returns a failure message
        if (!isPasswordValid) return { success: false, message: "Invalid password" };

        // Returns a success message and user details if authentication is successful
        return { success: true, user: dbUser };
    } catch (error) {
        // Logs an error message if the query or verification fails
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
};