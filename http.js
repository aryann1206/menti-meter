
let express = require("express");
let jwt = require("jsonwebtoken");
let app = express();
let z = require("zod");
app.use(express.json());
let { userModel, quizModel } = require("./db")


let userSchema = z.object({
    name: z.string(),
    password: z.string(),
    role: z.enum(["student", "admin"]),
    email: z.email()
})


app.post("/api/auth/signup", async (req, res) => {
    try {
        let { success, data, error } = userSchema.safeParse(req.body);
        if (!success) {
            res.status(401).json({
                success: false,
                error: "Invalid request schema"
            })
            return;
        }

        // check if user with the same email exists or 
        let userexist = await userModel.findOne({ email: data.email })
        if (userexist) {
            res.status(400).json({
                success: false,
                message: "user already exist"

            })
            return;
        }


        let user = await userModel.create({
            name: data.name, password: data.password, role: data.role, email: data.email
        })

        let token = jwt.sign({ userId: user._id, role: user.role }, "hkecdgkudecvg");
        res.status(200).json({
            success: true,
            data: user,
            token: token
        })
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            success: false,
            error: "invaild request schema"
        })
        return;
    }

})


app.post("/api/auth/signin", async (req, res) => {
    let { name, password } = req.body;

    let user = await userModel.findOne({ name, password });

    if (!user) {
        res.status(400).json({
            success: false,
            error: "Invalid email or password"
        })
        return;
    }

    let token = jwt.sign({ userId: user._id, role: user.role }, "hkecdgkudecvg");

    res.status(200).json({
        success: true,
        data: { token }
    })

})


function middlewarAuth(req, res, next) {
    let token = req.headers.token;
    try {
        let { userId, role } = jwt.verify(token, "hkecdgkudecvg");
        req.userId = userId;
        req.role = role;
        next();

    }
    catch (e) {
        res.status(401).json({
            success: false,
            error: "Unauthorized, token missing or invalid"
        })
    }

}





app.get("/api/auth/me", middlewarAuth, async (req, res) => {
    try {
       
        let userId = req.userId;
        let role = req.role;
        let user = await userModel.findOne({ _id: userId });
        res.status(200).json({
            success: true,
            data: { user }
        })

    }
    catch (e) {
        res.status(401).json({
            success: false,
            error: "Unauthorized, token missing or invalid"
        })
        return;
    }
})

const questionSchema = z.object({
    title: z.string(),
    options: z.array(z.string()).min(2),
    correctoption: z.number().min(1).max(4)
})

const quizSchema = z.object({
    title: z.string(),
    questions: z.array(questionSchema).min(1)
})




app.post("/api/quiz", middlewarAuth, async (req, res) => {
    try {
        let { success, data } = quizSchema.safeParse(req.body);
        let userId = req.userId;
        let role = req.role;
        if (!success) {
            res.status(400).json({
                success: false,
                error: "invaild request schema"
            })
            return;
        }
        if (role !== "admin") {
            res.status(401).json({
                success: false,
                error: "Unauthorized, admin access required"
            })
            return;
        }
        let quiz = await quizModel.create({
            title: data.title, questions: data.questions, correctoption: data.correctoption
        })
        res.status(201).json({
            success: true,
            data: { id: quiz._id, title: quiz.title }
        })
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            success: false,
            error: "invaild request schema"
        })
        return;
    }

})




app.post("/api/quiz/:quizId/questions", middlewarAuth, async (req, res) => {
    try {
        let userId = req.userId;
        let role = req.role;
        let quizId = req.params.quizId;
        let { title, options, correctoption } = req.body;
        if (role !== "admin") {
            res.status(401).json({
                success: false,
                error: "Unauthorized, admin access required"
            })
            return;
        }
        let quiz = await quizModel.findOne({ _id: quizId })
        if (!quiz) {
            res.status(400).json({
                success: false,
                error: "wrong quizId"
            })
            return;
        }
        quiz.questions.push({ title, options, correctoption });
        quiz.save();
        res.status(201).json({
            success: true,
            data: quiz
        })
    }
    catch (e) {
        res.status(400).json({
            success: false,
            error: "invaild request schema"
        })
        return;

    }
})




app.get("/api/quiz/:quizId", middlewarAuth, async (req, res) => {
    let quizId = req.params.quizId;

    let quiz = await quizModel.findOne({ _id: quizId });
    if (!quiz) {
        res.status(400).json({
            success: false,
            error: "quiz not found"
        })
        return;
    }
    res.status(200).json({
        success: true,
        data: quiz
    })
    return;

})


app.listen(3000, () => console.log("running"));