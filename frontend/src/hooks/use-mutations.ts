import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDownload } from "@/api/client";
import {
  activitiesApi,
  announcementsApi,
  certificatesApi,
  certificationsApi,
  eventsApi,
  meetingsApi,
  membersApi,
  notificationsApi,
  programApi,
  reportsApi,
  schoolsApi,
} from "@/api/services";
import { queryKeys } from "@/hooks/use-queries";

export function useApproveSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolsApi.updateStatus(id, "ACTIVE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schools });
      qc.invalidateQueries({ queryKey: queryKeys.applications });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useRejectSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolsApi.updateStatus(id, "REJECTED"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schools });
      qc.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      schoolsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schools }),
  });
}

export function useDeleteSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schoolsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schools }),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      membersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: membersApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useApproveActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.updateStatus(id, "APPROVED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activities }),
  });
}

export function useRejectActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.updateStatus(id, "REJECTED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activities }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activities }),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activities }),
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.meetings }),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      eventsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function usePublishEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.publish,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useConfirmEventAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.confirmAttendance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useApproveCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => certificationsApi.updateStatus(id, "APPROVED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.certifications }),
  });
}

export function useRejectCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => certificationsApi.updateStatus(id, "REJECTED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.certifications }),
  });
}

export function useRequestCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: certificationsApi.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.certifications });
      qc.invalidateQueries({ queryKey: queryKeys.certificates });
    },
  });
}

export function useGenerateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: certificatesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.certificates });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: ({ id, number }: { id: string; number: string }) =>
      apiDownload(`/certificates/${id}/download`, `${number}.html`),
  });
}

export function useDownloadAllCertificates() {
  return useMutation({
    mutationFn: () => apiDownload("/certificates/download/all", "plp-certificates.html"),
  });
}

export function useDownloadResource() {
  return useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      apiDownload(`/program/resources/${id}/download`, fileName),
  });
}

export function useUploadResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: programApi.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resources }),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      programApi.updateResource(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resources }),
  });
}

export function useArchiveResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: programApi.archiveResource,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resources }),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.generate,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reports }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
