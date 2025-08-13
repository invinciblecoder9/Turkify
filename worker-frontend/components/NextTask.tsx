"use client"
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useEffect, useState } from "react"
import Image from 'next/image';

interface Task {
    "id": number,
    "amount": number,
    "title": string,
    "options": {
        id: number;
        image_url: string;
        task_id: number
    }[]
}

// CSR
export const NextTask = () => {
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        })
        //@ts-ignore
            .then(res => {
                setCurrentTask(res.data.task);
                setLoading(false)
            })
            //@ts-ignore
            .catch(e => {
                setLoading(false)
                setCurrentTask(null)
            })
    }, [])
    
    if (loading) {
        return <div className="h-screen flex justify-center flex-col">
            <div className="w-full flex justify-center text-2xl">
                Loading...
            </div>
        </div>
    }

    if (!currentTask) {
        return <div className="h-screen flex justify-center flex-col">
            <div className="w-full flex justify-center text-2xl">
                Please check back in some time, there are no pending tasks at the moment
            </div>
        </div>
    }

    return <div>
        <div className='text-2xl pt-20 flex justify-center'>
            {currentTask.title}
            <div className="pl-4">
                {submitting && "Submitting..."}
            </div>
        </div>
        <div className='flex justify-center pt-8'>
            {currentTask.options.map(option => <Option onSelect={async () => {
                setSubmitting(true);
                try {
                    const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, {
                        taskId: currentTask.id.toString(),
                        selection: option.id.toString()
                    }, {
                        headers: {
                            "Authorization": localStorage.getItem("token")
                        }
                    });
    
                    const nextTask = response.data.nextTask;
                    if (nextTask) {
                        setCurrentTask(nextTask)
                    } else {
                        setCurrentTask(null);
                    }
                    // refresh the user balance in the appbar
                } catch(e) {
                    console.log(e);
                }
                setSubmitting(false);

            }} key={option.id} imageUrl={option.image_url} />)}
        </div>
    </div>
}

function Option({imageUrl, onSelect}: {
    imageUrl: string;
    onSelect: () => void;
}) {
    return <div>
        <img onClick={onSelect} className={"p-2 w-96 rounded-md"} src={imageUrl} />
    </div>
}


// "use client"
// import { BACKEND_URL } from "@/utils";
// import axios from "axios";
// import { useEffect, useState } from "react"
// import dynamic from 'next/dynamic'; // Import dynamic for Appbar

// // Dynamically import Appbar with ssr: false to prevent hydration errors
// const DynamicAppbar = dynamic(() => import('@/components/Appbar').then(mod => mod.Appbar), { ssr: false });

// interface Task {
//     "id": string, // Changed to string assuming UUIDs
//     "amount": number,
//     "title": string,
//     "options": {
//         id: string; // Changed to string assuming UUIDs
//         image_url: string;
//         task_id: string // Changed to string assuming UUIDs
//     }[]
// }

// export const NextTask = () => {
//     const [currentTask, setCurrentTask] = useState<Task | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);

//     useEffect(() => {
//         setLoading(true);
//         axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
//             headers: {
//                 "Authorization": localStorage.getItem("token")
//             }
//         })
//             .then(res => {
//                 setCurrentTask(res.data.task);
//                 setLoading(false)
//             })
//             // @ts-expect-error
//             .catch(e => {
//                 setLoading(false)
//                 setCurrentTask(null)
//                 console.error("Error fetching next task:", e); // Log error for debugging
//             })
//     }, [])
    
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-screen bg-gray-900 text-white"> {/* Full screen height, dark background, centered */}
//                 <div className="text-3xl font-bold animate-pulse">
//                     Loading tasks...
//                 </div>
//             </div>
//         );
//     }

//     if (!currentTask) {
//         return (
//             <div className="flex justify-center items-center h-screen bg-gray-900 text-white"> {/* Full screen height, dark background, centered */}
//                 <div className="text-2xl font-semibold text-center px-4">
//                     Please check back in some time, there are no pending tasks at the moment.
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-900 text-white"> {/* Full height, dark background */}
//             {/* Appbar is expected to be rendered by a parent layout, so it's removed from here */}
//             {/* <DynamicAppbar /> */} 
//             <div className="container mx-auto px-4 py-8"> {/* Centered content area with padding */}
//                 {/* Task Title and Submitting Status */}
//                 <div className="text-4xl md:text-5xl font-extrabold text-center mb-8 pt-10 flex flex-col items-center text-gray-100 drop-shadow-lg"> {/* Enhanced title styling */}
//                     {currentTask.title}
//                     {submitting && (
//                         <div className="mt-4 text-xl font-semibold text-yellow-400 animate-pulse">
//                             Submitting...
//                         </div>
//                     )}
//                 </div>

//                 {/* Options Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center"> {/* Responsive grid for options */}
//                     {currentTask.options.map(option => (
//                         <Option 
//                             onSelect={async () => {
//                                 setSubmitting(true);
//                                 try {
//                                     const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, {
//                                         taskId: currentTask.id, // Use string ID directly
//                                         selection: option.id, // Use string ID directly
//                                     }, {
//                                         headers: {
//                                             "Authorization": localStorage.getItem("token")
//                                         }
//                                     });
                
//                                     const nextTask = response.data.nextTask;
//                                     if (nextTask) {
//                                         setCurrentTask(nextTask);
//                                     } else {
//                                         setCurrentTask(null); // No more tasks
//                                     }
//                                     // Optionally, refresh balance in Appbar if it's a prop
//                                     // onBalanceUpdate(response.data.amount);
//                                 } catch(e) {
//                                     console.error("Submission failed:", e);
//                                     alert(`Submission failed: ${e instanceof Error ? e.message : "An unknown error occurred"}`);
//                                 }
//                                 setSubmitting(false);
//                             }} 
//                             key={option.id} 
//                             imageUrl={option.image_url} 
//                             disabled={submitting} // Disable option while submitting
//                         />
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }

// function Option({imageUrl, onSelect, disabled}: {
//     imageUrl: string;
//     onSelect: () => void;
//     disabled?: boolean; // Added disabled prop
// }) {
//     return (
//         <div 
//             onClick={disabled ? undefined : onSelect} // Disable click handler when disabled
//             className={`relative w-full max-w-sm h-auto rounded-lg overflow-hidden shadow-xl border-2 border-transparent 
//                        transition-all duration-300 ease-in-out cursor-pointer 
//                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:shadow-2xl transform hover:scale-105'}`}
//         >
//              <Image // <--- Use Image component
            //     src={imageUrl}
            //     alt="Task option" // <--- Ensure alt prop is present
            //     width={384} // Set a fixed width (e.g., 384px for w-96)
            //     height={256} // Set a fixed height (adjust as needed for aspect ratio)
            //     className="w-full h-full object-cover rounded-md"
            // />
//             {/* Optional overlay for disabled state */}
//             {disabled && (
//                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-bold">
//                     Submitting...
//                 </div>
//             )}
//         </div>
//     );
// }


