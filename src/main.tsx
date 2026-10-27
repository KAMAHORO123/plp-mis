import { LanguageDocument } from './i18n/language';
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "@/app/router";
import { ConfirmHost } from "@/components/shared/confirm-dialog";
import { queryClient } from "@/app/query-client";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageDocument/>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ConfirmHost />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: "font-sans" }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
