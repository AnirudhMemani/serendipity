import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { UserManager } from "./managers/UserManger.js";

dotenv.config();

const app = express();
const server = createServer(app);

const port = parseInt(process.env.PORT || "3000");
const allowedHosts = process.env.ALLOWED_HOSTS || "*";

app.get("/", (_req: Request, res: Response) => {
    res.send(
        `<div style="display: flex; justify-content: center; align-items: center; height: 100vh;">Welcome to Serendipity!</div>`
    );
});

const io = new Server(server, {
    cors: {
        origin: allowedHosts.split(","),
    },
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
    console.log("a user connected");
    userManager.addUser("randomName", socket);
    socket.on("disconnect", () => {
        console.log("user disconnected");
        userManager.removeUser(socket.id);
    });
});

server.listen(port, () => {
    console.log(`${new Date().toLocaleTimeString()} Listening on port ${port}`);
});
