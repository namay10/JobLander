"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { useEffect, useState } from "react";
import CommonForm from "../common-form";
import {
  candidateOnboardFormControls,
  initialCandidateFormData,
  initialRecruiterFormData,
  recruiterOnboardFormControls,
} from "@/utils";
import { useUser } from "@clerk/nextjs";
import { createProfileAction } from "@/actions";
import { createClient } from "@supabase/supabase-js";
import { toast } from "react-toastify"; // Assuming you have react-toastify for notifications

const supabaseClient = createClient(
  "https://ugextuedfgashimuucek.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZXh0dWVkZmdhc2hpbXV1Y2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc2MDEyMDksImV4cCI6MjA0MzE3NzIwOX0.E1QKki3lLJGlzbJk1VO9nTpGHVxzbJQebzw2LgKnU6c"
);

function OnBoard() {
  const [currentTab, setCurrentTab] = useState("candidate");
  const [recruiterFormData, setRecruiterFormData] = useState(
    initialRecruiterFormData
  );
  const [candidateFormData, setCandidateFormData] = useState(
    initialCandidateFormData
  );
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // New state for handling upload status

  const currentAuthUser = useUser();
  const { user } = currentAuthUser;

  function handleFileChange(event) {
    event.preventDefault();
    const selectedFile = event.target.files[0];

    // Validate file type
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Please upload a PDF file.");
    }
  }

  async function handleUploadPdfToSupabase() {
    setIsUploading(true); // Start uploading state
    const { data, error } = await supabaseClient.storage
      .from("job-board-public")
      .upload(`/public/${file.name}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setIsUploading(false); // End uploading state
    if (data) {
      setCandidateFormData({
        ...candidateFormData,
        resume: data.path,
      });
      toast.success("Resume uploaded successfully!");
    } else {
      toast.error("Failed to upload the resume. Please try again.");
    }
  }

  useEffect(() => {
    if (file) handleUploadPdfToSupabase();
  }, [file]);

  function handleTabChange(value) {
    setCurrentTab(value);
  }

  function handleRecuiterFormValid() {
    return (
      recruiterFormData &&
      recruiterFormData.name.trim() !== "" &&
      recruiterFormData.companyName.trim() !== "" &&
      recruiterFormData.companyRole.trim() !== ""
    );
  }

  function handleCandidateFormValid() {
    return Object.keys(candidateFormData).every(
      (key) => candidateFormData[key].trim() !== ""
    );
  }

  async function createProfile() {
    const data =
      currentTab === "candidate"
        ? {
            candidateInfo: candidateFormData,
            role: "candidate",
            isPremiumUser: false,
            userId: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
          }
        : {
            recruiterInfo: recruiterFormData,
            role: "recruiter",
            isPremiumUser: false,
            userId: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
          };

    await createProfileAction(data, "/onboard");
    toast.success("Profile created successfully!");
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center mb-8">
          Welcome to Onboarding
        </h1>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <div className="w-full mb-6">
            <TabsList className="flex justify-center space-x-4">
              <TabsTrigger
                value="candidate"
                className={`px-6 py-2 rounded-full text-white font-semibold focus:outline-none ${
                  currentTab === "candidate"
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                Candidate
              </TabsTrigger>
              <TabsTrigger
                value="recruiter"
                className={`px-6 py-2 rounded-full text-white font-semibold focus:outline-none ${
                  currentTab === "recruiter"
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                Recruiter
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="candidate">
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <CommonForm
                action={createProfile}
                formData={candidateFormData}
                setFormData={setCandidateFormData}
                formControls={candidateOnboardFormControls}
                buttonText={"Onboard as candidate"}
                handleFileChange={handleFileChange}
                isBtnDisabled={!handleCandidateFormValid() || isUploading}
              />
              {isUploading && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Uploading resume...
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recruiter">
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <CommonForm
                formControls={recruiterOnboardFormControls}
                buttonText={"Onboard as recruiter"}
                formData={recruiterFormData}
                setFormData={setRecruiterFormData}
                isBtnDisabled={!handleRecuiterFormValid()}
                action={createProfile}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default OnBoard;
