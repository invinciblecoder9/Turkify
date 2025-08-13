// export const Hero = () => {
//     return (
//         // Main container: Centered, with padding, a modern gradient, shadow, and rounded corners
//         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 py-16 bg-gradient-to-br from-gray-100 to-gray-200 text-black shadow-inner rounded-t-xl">
//             {/* Main Title: Larger, bolder, with tracking and a subtle text shadow */}
//             <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center tracking-tight leading-tight mb-4 drop-shadow-md">
//                 Welcome to <span className="text-blue-600">Turkify</span> ✨
//             </div>
//             {/* Subtitle: Slightly smaller, refined typography, and centered */}
//             <div className="text-xl md:text-2xl text-center text-gray-700 max-w-2xl">
//                 Your one-stop destination to getting your data <span className="font-semibold text-purple-700">labelled</span> efficiently and accurately.
//             </div>
//         </div>
//     );
// }


export const Hero = () => {
    return (
        // Main container: Centered, with padding, a modern gradient, shadow, rounded corners, and a fade-in animation
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 py-16 bg-gradient-to-br from-gray-100 to-gray-200 text-black shadow-inner rounded-t-xl
                    animate-fadeIn"> {/* Added fade-in animation */}
            {/* Main Title: Larger, bolder, with tracking, subtle text shadow, and a slide-in animation */}
            <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center tracking-tight leading-tight mb-4 drop-shadow-md
                        animate-slideInFromTop"> {/* Added slide-in animation */}
                Welcome to <span className="text-blue-600">Turkify</span> ✨
            </div>
            {/* Subtitle: Slightly smaller, refined typography, centered, and a delayed fade-in animation */}
            <div className="text-xl md:text-2xl text-center text-gray-700 max-w-2xl
                        animate-fadeIn animate-delay-500"> {/* Added fade-in with delay */}
                Your one-stop destination to getting your data <span className="font-semibold text-purple-700">labelled</span> efficiently and accurately.
            </div>
        </div>
    );
}
