import express from "express";
import { User, connectToDatabase } from "db/client";
import { SignupSchema, SigninSchema } from "common";


const app = express();
app.use(express.json());

app.post("/signup", async (req,res) => {
    const { success, data } = SignupSchema.safeParse(req.body);
    if (!success) {
       return res.status(403).json({
        message: "INcorrect inputs"
       });
    }  
    try {
        const user =  await User.create({
            username: data?.username,
            password: data?.password
        })
        return res.status(201).json({
            message: "User created successfully",
            id: user._id
        });
    } catch (err) {
            return res.status(500).json({
                message: "Internal server error",
                error: err instanceof Error ? err.message : "Unknown error"
            });
    }
})

app.post("/signin", (req,res) => {
    
})

app.post("/workflow", (req,res) => {
    
})

app.put("/workflow", (req,res) => {
    
})

app.get("/workflow/:workflowId", (req,res) => {


})

app.get("/workflow/execcution/:workflowId", (req,res) => {  
    
})

const startServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error("Mongo connection failed: MONGO_URI is not set");
            process.exit(1);
        }

        await connectToDatabase(mongoUri);
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    } catch (error) {
        console.error("Mongo connection failed:", error);
        process.exit(1);
    }
};

void startServer();
