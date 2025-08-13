"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection("https://solana-devnet.g.alchemy.com/v2/vY6QqmImyweRBYMpQ2PU0");
const JWT_SECRET = process.env.JWT_SECRET;
const PARENT_WALLET_ADDRESS = "97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx";
const DEFAULT_TITLE = "Select the most clickable thumbnail";
const { Storage } = require('@google-cloud/storage');
//const storage = new Storage();
let serviceAccountCredentials;
try {
    if (!process.env.GCP_SERVICE_ACCOUNT_KEY_JSON) {
        throw new Error("GCP_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.");
    }
    // CRITICAL FIX: Parse the JSON string from the environment variable
    serviceAccountCredentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY_JSON);
}
catch (e) {
    console.error("CRITICAL ERROR: Failed to parse GCP_SERVICE_ACCOUNT_KEY_JSON environment variable.", e);
    // Exit the process or handle this critical error appropriately
    process.exit(1);
}
const storage = new Storage({
    credentials: serviceAccountCredentials
});
// @ts-ignore
// const s3Client = new S3Client({
//     credentials: {
//         accessKeyId: process.env.ACCESS_KEY_ID ?? "",
//         secretAccessKey: process.env.ACCESS_SECRET ?? "",
//     },
//     region: "us-east-1"
// })
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
prismaClient.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
    // Code running in a transaction...
}), {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
});
// @ts-ignore
function generateV4UploadSignedUrl(bucketName, filename, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000,
            contentType: contentType,
        };
        try {
            const file = storage.bucket(bucketName).file(filename);
            const [url] = yield file.getSignedUrl(options);
            return url;
        }
        catch (error) {
            // Log the detailed error from GCS library here
            console.error("GCS Signed URL generation failed with error:", error);
            throw error; // Re-throw the error to be caught by the route handler
        }
    });
}
router.get("/task/:id", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.id; // Access from req.params
    // @ts-ignore
    const userId = req.userId;
    if (!taskId) {
        return res.status(400).json({ message: "Task ID is required." });
    }
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User ID not found." });
    }
    try {
        // Assuming Task.id and Task.user_id are STRING UUIDs in Prisma schema
        const taskDetails = yield prismaClient.task.findFirst({
            where: {
                user_id: Number(userId),
                id: Number(taskId)
            },
            include: {
                options: true
            }
        });
        if (!taskDetails) {
            return res.status(404).json({
                message: "Task not found or you don't have access to this task."
            });
        }
        // Fetch submissions for this task
        // Assuming Submission.task_id and Submission.option_id are STRING UUIDs
        const responses = yield prismaClient.submission.findMany({
            where: {
                task_id: Number(taskId)
            },
            include: {
                option: true
            }
        });
        const result = {};
        taskDetails.options.forEach(option => {
            result[option.id] = {
                count: 0,
                option: {
                    imageUrl: option.image_url
                }
            };
        });
        responses.forEach(r => {
            if (result[r.option_id]) {
                result[r.option_id].count++;
            }
            else {
                console.warn(`Submission references unknown option_id: ${r.option_id} for task ${taskId}`);
            }
        });
        res.json({
            taskDetails: taskDetails,
            result: result
        });
    }
    catch (error) {
        console.error("Error in GET /task/:id route:", error);
        res.status(500).json({ error: "Internal server error fetching task details" });
    }
}));
router.get("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const taskId = req.query.taskId;
    // @ts-ignore
    const userId = req.userId;
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "You dont have access to this task"
        });
    }
    const responses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        };
    });
    responses.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result
    });
}));
// router.get("/task", authMiddleware, async(req, res) => {
//     // @ts-ignore
//     const taskId: string | undefined = req.query.taskId; // taskId can be undefined
//     // @ts-ignore
//     const userId: string | undefined = req.userId; // userId can be undefined if auth fails
//     // --- ADDED: Input Validation ---
//     if (!taskId || isNaN(Number(taskId))) {
//         return res.status(400).json({ message: "Invalid or missing taskId" });
//     }
//     if (!userId || isNaN(Number(userId))) {
//         // This case should ideally be caught by authMiddleware, but good for a fallback
//         return res.status(401).json({ message: "Authentication failed or userId missing" });
//     }
//     try { // --- ADDED: Try-Catch Block for robust error handling ---
//         const taskDetails = await prismaClient.task.findFirst({
//             where: {
//                 user_id: Number(userId),
//                 id: Number(taskId)
//             },
//             include: {
//                 options: true
//             }
//         });
//         // --- CHANGED: Status code from 411 to 403 ---
//         if(!taskDetails) {
//             return res.status(403).json({ // 403 Forbidden is more appropriate for "no access"
//                 message: "You don't have access to this task or task not found"
//             });
//         }
//         const responses = await prismaClient.submission.findMany({
//             where: {
//                 task_id: Number(taskId)
//             },
//             include: {
//                 option: true
//             }
//         });
//         const result: Record<string, {
//             count: number;
//             option: {
//                 imageUrl: string
//             }
//         }> = {};
//         taskDetails.options.forEach(option => {
//             result[option.id] = {
//                 count: 0,
//                 option: {
//                     imageUrl: option.image_url
//                 }
//             }
//         });
//         responses.forEach(r => {
//             // --- CHANGED: Added check for r.option_id existence ---
//             if (result[r.option_id]) { // Ensure the option exists in our result map
//                 result[r.option_id].count++;
//             } else {
//                 // Optional: Log a warning if a submission references an unknown option
//                 console.warn(`Submission references unknown option_id: ${r.option_id} for taskId: ${taskId}`);
//             }
//         });
//         res.json({
//             result
//         });
//     } catch (error) { // --- ADDED: Catch block for database/server errors ---
//         console.error("Error in /task route:", error); // Log the actual error for debugging
//         res.status(500).json({ error: "Internal server error while fetching task details" });
//     }
// });
router.get("/presignedUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const gcsBucketName = 'turkify-bucket97';
    const gcsFilename = `fiver/${userId}/${Math.random().toString(36).substring(2, 15)}/image.png`;
    const gcsContentType = 'image/png';
    try {
        const url = yield generateV4UploadSignedUrl(gcsBucketName, gcsFilename, gcsContentType);
        console.log({ preSignedUrl: url });
        res.json({
            preSignedUrl: url
        });
    }
    catch (error) {
        // Log the error caught from the generateV4UploadSignedUrl function
        console.error("Error in /presignedUrl route:", error);
        res.status(500).json({ error: "Failed to generate pre-signed URL" });
    }
}));
// router.get("/presignedUrl", authMiddleware, async (req, res) => {
//     // @ts-ignore
//     const userId = req.userId;
//       const { url, fields } = await createPresignedPost(s3Client, {
//         Bucket: 'hkirat-cms',
//         Key: `fiver/${userId}/${Math.random()}/image.jpg`,
//         Conditions: [
//           ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
//         ],
//         Expires: 3600
//     })
//     console.log({url, fields})
//     res.json({
//         preSignedUrl: url
//     })
// })
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    //@ts-ignore
    const userId = req.userId;
    // validate the inputs from the user;
    const body = req.body;
    const parseData = types_1.createTaskInput.safeParse(body);
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        });
    }
    const transaction = yield connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    console.log(transaction);
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    if (((_g = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _g === void 0 ? void 0 : _g.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    // was this money paid by this user address or a different address?
    // parse the signature here to ensure the person has paid 0.1 SOL
    // const transaction = Transaction.from(parseData.data.signature);
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const response = yield tx.task.create({
            data: {
                title: (_a = parseData.data.title) !== null && _a !== void 0 ? _a : DEFAULT_TITLE,
                amount: 0.1 * config_1.TOTAL_DECIMALS,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });
        yield tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
// signin with wallet
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    //const signedString = "Sign into mechanical turks";
    const message = new TextEncoder().encode("Sign into mechanical turks");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const existingUser = yield prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: publicKey,
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, JWT_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
