"use client"
import { BACKEND_URL, CLOUDFRONT_URL } from "@/utils";
import axios from "axios";
import { useState } from "react"

export function UploadImage({ onImageAdded, image }: {
    onImageAdded: (image: string) => void;
    image?: string;
}) {
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        setUploading(true);
        try {
            const file = e.target.files[0];

            // 1. Get pre-signed URL from backend (now GCP specific)
            const response = await axios.get(`${BACKEND_URL}/v1/user/presignedUrl`, {
                headers: {
                    // Ensure the "Bearer " prefix is added to the token
                    "Authorization": `${localStorage.getItem("token")}` 
                }
            });
            const presignedUrl = response.data.preSignedUrl;

            // 2. Upload file directly using PUT request (GCP specific)
            // For GCP pre-signed PUT, you send the file directly as the body
            // and the Content-Type header is crucial.
            // 3. Construct the final image URL for display
            // The preSignedUrl from GCP contains the full GCS path.
            // We need to extract the object key (path within the bucket) from it.
            const urlObject = new URL(presignedUrl);
            // Example: presignedUrl = "https://storage.googleapis.com/demo-bucket9/fiver/user1/abc/image.jpg?X-Goog-Algorithm=..."
            // urlObject.pathname will be "/demo-bucket9/fiver/user1/abc/image.jpg"
            // We want "fiver/user1/abc/image.jpg"
            const pathSegments = urlObject.pathname.split('/');
            const objectKey = pathSegments.slice(2).join('/'); // Removes the leading empty string and bucket name

            // Assuming CLOUDFRONT_URL is your CDN base URL (e.g., "https://your-cdn.com" or "https://storage.googleapis.com")
            // The final URL will be CLOUDFRONT_URL/objectKey
            onImageAdded(`${CLOUDFRONT_URL}/${objectKey}`);

        } catch(e) {
            // Use console.error for better error visibility in the browser console
            console.error("Image upload failed:", e); 
        }
        setUploading(false);
    }

    if (image) {
        return <img className={"p-2 w-96 rounded"} src={image} alt="Uploaded content" /> // Added alt text for accessibility
    }

     return (
        <div>
            <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
                <div className="h-full flex justify-center flex-col relative w-full">
                    <div className="h-full flex justify-center w-full pt-16 text-4xl text-black"> {/* Added text-black here */}
                        {uploading ? <div className="text-sm">Loading...</div> : <>
                            +
                            <input className="w-full h-full bg-red-400 w-40 h-40" type="file" style={{position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%"}} onChange={onFileSelect} />
                        </>}
                    </div>
                </div>
            </div>
        </div>
    );
}