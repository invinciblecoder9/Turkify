// "use client"
// import { Appbar } from '@/components/Appbar';
// import { BACKEND_URL } from '@/utils';
// import axios from 'axios';
// import { useEffect, useState } from 'react';

// async function getTaskDetails(taskId: string) {
//     const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
//         headers: {
//             "Authorization": localStorage.getItem("token")
//         }
//     })
//     return response.data
// }

// export default function Page({params: { 
//     taskId 
// }}: {params: { taskId: string }}) {
//     const [result, setResult] = useState<Record<string, {
//         count: number;
//         option: {
//             imageUrl: string
//         }
//     }>>({});
//     const [taskDetails, setTaskDetails] = useState<{
//         title?: string
//     }>({});

//     useEffect(() => {
//         getTaskDetails(taskId)
//             .then((data) => {
//                 setResult(data.result)
//                 setTaskDetails(data.taskDetails)
//             })
//     }, [taskId]);

//     return <div>
//         <Appbar />
//         <div className='text-2xl pt-20 flex justify-center'>
//             {taskDetails.title}
//         </div>
//         <div className='flex justify-center pt-8'>
//             {Object.keys(result || {}).map(taskId => <Task imageUrl={result[taskId].option.imageUrl} votes={result[taskId].count} />)}
//         </div>
//     </div>
// }

// function Task({imageUrl, votes}: {
//     imageUrl: string;
//     votes: number;
// }) {
//     return <div>
//         <img className={"p-2 w-96 rounded-md"} src={imageUrl} />
//         <div className='flex justify-center'>
//             {votes}
//         </div>
//     </div>
// }


"use client"
import { BACKEND_URL } from '@/utils';
import axios from 'axios';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic for Appbar

// Dynamically import Appbar with ssr: false to prevent hydration errors
const DynamicAppbar = dynamic(() => import('@/components/Appbar').then(mod => mod.Appbar), { ssr: false });

// Define interfaces for better type safety and clarity
interface TaskOption {
    id: string; // Assuming options have an ID in your backend
    imageUrl: string;
}

interface TaskDetails {
    id: string;
    title: string;
    amount: number; // Assuming amount is part of task details
    signature: string;
    options: TaskOption[]; // Array of options for the task
    // Add other task properties if they exist in your backend response
}

// The structure for the results part of the response (assuming keys are option IDs or similar)
interface TaskResultOption {
    imageUrl: string;
}

interface TaskResultEntry {
    count: number;
    option: TaskResultOption;
}

// Define the expected full response structure from your backend's GET /v1/user/task/:id
interface BackendTaskResponse {
    taskDetails: TaskDetails;
    result: Record<string, TaskResultEntry>; // Keys are likely option IDs or selection values
}

// Function to fetch task details from the backend
async function getTaskData(taskId: string): Promise<BackendTaskResponse> {
    const token = localStorage.getItem("token"); // Access localStorage on client-side
    if (!token) {
        throw new Error("Authentication token not found. Please sign in.");
    }
    // CORRECTED: Construct the URL to use taskId as a path parameter
    const response = await axios.get(`${BACKEND_URL}/v1/user/task/${taskId}`, { // <--- CHANGE HERE
        headers: {
            "Authorization": token
        }
    });
    return response.data;
}

export default function Page({ params }: { params: { taskId: string } }) {
    const { taskId } = params; // Destructure taskId directly from params prop

    const [taskResults, setTaskResults] = useState<Record<string, TaskResultEntry>>({});
    const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null); // Initialize as null
    const [loading, setLoading] = useState(true); // State for loading indicator
    const [error, setError] = useState<string | null>(null); // State for error messages

    useEffect(() => {
        if (!taskId) {
            setError("Task ID is missing in URL.");
            setLoading(false);
            return;
        }

        const fetchAndSetData = async () => {
            try {
                setLoading(true); // Start loading
                setError(null); // Clear previous errors
                const data = await getTaskData(taskId); // Fetch data
                setTaskResults(data.result);
                setTaskDetails(data.taskDetails);
            } catch (err) {
                console.error("Failed to fetch task details:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching task.");
            } finally {
                setLoading(false); // End loading regardless of success or failure
            }
        };

        fetchAndSetData();
    }, [taskId]); // Dependency array includes taskId

    // --- Conditional Rendering for Loading, Error, and No Data States ---
    if (loading) {
        return (
            <div>
                <DynamicAppbar />
                <div className='flex justify-center items-center pt-20 text-black'>Loading task details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <DynamicAppbar />
                <div className='flex justify-center items-center pt-20 text-red-500'>Error: {error}</div>
            </div>
        );
    }

    if (!taskDetails) { // Handle case where taskDetails is null after loading (e.g., task not found)
        return (
            <div>
                <DynamicAppbar />
                <div className='flex justify-center items-center pt-20 text-black'>Task not found or data is incomplete.</div>
            </div>
        );
    }

    // --- Main Content Rendering ---
    return (
        <div>
            <DynamicAppbar />
            <div className='text-2xl pt-20 flex justify-center text-black'>
                {taskDetails.title || "No Title Provided"} {/* Provide a fallback for title */}
            </div>
            <div className='flex justify-center pt-8'>
                {/* Display submission results if available, otherwise display original task options */}
                {Object.keys(taskResults).length > 0 ? (
                    Object.keys(taskResults).map(optionKey => (
                        <Task
                            key={optionKey} // Unique key for each Task component
                            imageUrl={taskResults[optionKey].option.imageUrl}
                            votes={taskResults[optionKey].count}
                        />
                    ))
                ) : (
                    taskDetails.options.length === 0 ? (
                        <div className='text-black'>No images for this task.</div>
                    ) : (
                        taskDetails.options.map(option => ( // Fallback to displaying original task options
                            <Task
                                key={option.id} // Use option.id as key
                                imageUrl={option.imageUrl}
                                votes={0} // No votes yet
                            />
                        ))
                    )
                )}
            </div>
        </div>
    );
}

// Task component remains largely the same, but ensure it's outside the main Page component
function Task({ imageUrl, votes }: {
    imageUrl: string;
    votes: number;
}) {
    return (
        <div className="p-2"> {/* Added some padding around each task image */}
            <img className={"p-2 w-96 rounded-md"} src={imageUrl} alt="Task image" /> {/* Added alt text for accessibility */}
            <div className='flex justify-center text-black'> {/* Ensure text is black */}
                Votes: {votes}
            </div>
        </div>
    );
}

