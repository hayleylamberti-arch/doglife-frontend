import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Building,
  MapPin,
  FileText,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */

const providerRegistrationSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    mobileNumber: z.string().min(10, "Please enter a valid mobile number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),

    suburb: z.string().min(1, "Please enter your suburb"),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),

    selectedServices: z.array(z.string()).min(1),
    aboutServices: z.string().min(10),

    providerType: z.enum(["business", "individual"]),

    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),

    termsAccepted: z.boolean().refine(val => val === true, {
  message: "You must accept the terms",
}),

  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ProviderRegistrationFormData = z.infer<
  typeof providerRegistrationSchema
>;

const availableServices = [
  "Walking",
  "Grooming",
  "Training",
  "Boarding",
  "Pet Sitting",
  "Doggy Daycare",
];

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

interface ProviderRegistrationFormProps {
  onSuccess?: () => void;
}

export default function ProviderRegistrationForm({
  onSuccess,
}: ProviderRegistrationFormProps) {

  const { registerMutation } = useAuth();

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const form = useForm<ProviderRegistrationFormData>({
    resolver: zodResolver(providerRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      suburb: "",
      address: "",
      city: "",
      province: "",
      selectedServices: [],
      aboutServices: "",
      providerType: "individual",
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      termsAccepted: false,
    },
  });

  const providerType = form.watch("providerType");

  const onSubmit = async (data: ProviderRegistrationFormData) => {
    const [firstName, ...rest] = data.fullName.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    console.log("Submitting supplier registration:", {
    email: data.email,
    firstName,
    lastName,
  });

    await registerMutation.mutateAsync({
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      mobilePhone: data.mobileNumber,
      role: "SUPPLIER" as const,
    });

    window.location.href = "/supplier-profile-modern";
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Provider Account</CardTitle>
        <CardDescription>
          Join DogLife as a trusted service provider
        </CardDescription>
      </CardHeader>

  <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <CardContent className="space-y-6">
            {/* Basic Info */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Passwords */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider Type */}
            <FormField
              control={form.control}
              name="providerType"
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <RadioGroupItem value="individual" />
                  Individual
                  <RadioGroupItem value="business" />
                  Business
                </RadioGroup>
              )}
            />

            {/* Terms */}
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormLabel>I agree to the terms</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Provider Account"
              )}
            </Button>
          </CardContent>
      </Form>
    </Card>
  );
}
