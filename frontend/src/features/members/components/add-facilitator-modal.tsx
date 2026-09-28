import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateMember } from "@/hooks/use-mutations";
import { useSchools } from "@/hooks/use-queries";

const DISTRICTS = ["Nyagatare", "Nyabihu", "Musanze", "Huye", "Gicumbi", "Rwamagana"];

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  district: z.string().min(1, "Select a district"),
  schoolId: z.string().min(1, "Select a school"),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface AddFacilitatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFacilitatorModal({ open, onOpenChange }: AddFacilitatorModalProps) {
  const createMember = useCreateMember();
  const { data: schools = [] } = useSchools();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", district: "", schoolId: "", phone: "", email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const school = schools.find((s) => s.id === values.schoolId);
      await createMember.mutateAsync({
        name: `${values.firstName} ${values.lastName}`,
        memberCode: `FAC-${Date.now()}`,
        kind: "FACILITATOR",
        affiliation: school?.name ?? "National",
        district: values.district,
        schoolId: values.schoolId,
        phone: values.phone,
        email: values.email || undefined,
      });
      toast.success(`${values.firstName} ${values.lastName} added as facilitator`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add facilitator");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Add New Facilitator</DialogTitle>
            <DialogDescription>Add a new facilitator to a school</DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select value={watch("district")} onValueChange={(v) => setValue("district", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned School</Label>
              <Select value={watch("schoolId")} onValueChange={(v) => setValue("schoolId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select School" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>
          <Button type="submit" loading={isSubmitting || createMember.isPending} className="mt-2">
            Save <Send />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
