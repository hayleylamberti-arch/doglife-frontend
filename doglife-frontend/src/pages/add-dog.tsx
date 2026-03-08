import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, ArrowLeft, CalendarIcon, Heart, Loader2, Camera } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Define dog schema for form validation - matching our API
const addDogSchema = z.object({
  name: z.string().min(1, "Dog name is required"),
  breed: z.string().optional(),
  gender: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "XL"]).optional(),
  birthDate: z.string().optional(), // Will be converted to Date
  notes: z.string().optional(),
  photoUrl: z.string().optional()
});

type AddDogFormData = z.infer<typeof addDogSchema>;

export default function AddDogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AddDogFormData>({
    resolver: zodResolver(addDogSchema),
    defaultValues: {
      name: "",
      breed: "",
      gender: "",
      size: "MEDIUM",
      birthDate: "",
      notes: "",
      photoUrl:""
    },
  });

  // Add dog mutation using our new API
  const addDogMutation = useMutation({
  mutationFn: async (data: AddDogFormData) => {
    const res = await apiRequest("/api/owner/dogs", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return res.json();
  },
    
    onSuccess: () => {
      toast({
        title: "Dog added successfully!",
        description: "Your furry friend has been added to your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dogs/mine'] });
      navigate("/my-dogs");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add dog",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddDogFormData) => {
    setIsSubmitting(true);
    addDogMutation.mutate(data);
    setIsSubmitting(false);
  };

  const dogBreeds = [
"Afghan Hound",
"Airedale Terrier",
"Akita",
"Alaskan Malamute",
"American Bulldog",
"American Eskimo Dog",
"American Foxhound",
"American Staffordshire Terrier",
"Anatolian Shepherd Dog",
"Australian Cattle Dog",
"Australian Shepherd",
"Australian Terrier",
"Basenji",
"Basset Hound",
"Beagle",
"Bearded Collie",
"Bedlington Terrier",
"Belgian Malinois",
"Belgian Sheepdog",
"Belgian Tervuren",
"Bernese Mountain Dog",
"Bichon Frise",
"Black Russian Terrier",
"Bloodhound",
"Border Collie",
"Border Terrier",
"Borzoi",
"Boston Terrier",
"Bouvier des Flandres",
"Boxer",
"Boykin Spaniel",
"Briard",
"Brittany",
"Brussels Griffon",
"Bulldog",
"Bull Terrier",
"Bulmastiff",
"Cairn Terrier",
"Canaan Dog",
"Cane Corso",
"Cardigan Welsh Corgi",
"Cavalier King Charles Spaniel",
"Chesapeake Bay Retriever",
"Chihuahua",
"Chinese Crested",
"Chow Chow",
"Clumber Spaniel",
"Cocker Spaniel",
"Collie",
"Curly-Coated Retriever",
"Dachshund",
"Dalmatian",
"Dandie Dinmont Terrier",
"Doberman Pinscher",
"Dogo Argentino",
"Dogue de Bordeaux",
"English Cocker Spaniel",
"English Foxhound",
"English Setter",
"English Springer Spaniel",
"English Toy Spaniel",
"Entlebucher Mountain Dog",
"Field Spaniel",
"Finnish Spitz",
"Flat-Coated Retriever",
"French Bulldog",
"German Pinscher",
"German Shepherd",
"German Shorthaired Pointer",
"German Wirehaired Pointer",
"Giant Schnauzer",
"Glen of Imaal Terrier",
"Golden Retriever",
"Gordon Setter",
"Great Dane",
"Great Pyrenees",
"Greater Swiss Mountain Dog",
"Greyhound",
"Havanese",
"Irish Setter",
"Irish Terrier",
"Irish Water Spaniel",
"Irish Wolfhound",
"Italian Greyhound",
"Jack Russell Terrier",
"Japanese Chin",
"Keeshond",
"Kerry Blue Terrier",
"Komondor",
"Kuvasz",
"Labrador Retriever",
"Lagotto Romagnolo",
"Lakeland Terrier",
"Leonberger",
"Lhasa Apso",
"Lowchen",
"Maltese",
"Manchester Terrier",
"Mastiff",
"Miniature Bull Terrier",
"Miniature Pinscher",
"Miniature Schnauzer",
"Neapolitan Mastiff",
"Newfoundland",
"Norfolk Terrier",
"Norwegian Elkhound",
"Norwich Terrier",
"Nova Scotia Duck Tolling Retriever",
"Old English Sheepdog",
"Otterhound",
"Papillon",
"Parson Russell Terrier",
"Pekingese",
"Pembroke Welsh Corgi",
"Petit Basset Griffon Vendeen",
"Pharaoh Hound",
"Plott",
"Pointer",
"Polish Lowland Sheepdog",
"Pomeranian",
"Poodle",
"Portuguese Water Dog",
"Pug",
"Puli",
"Pumi",
"Rat Terrier",
"Redbone Coonhound",
"Rhodesian Ridgeback",
"Rottweiler",
"Saint Bernard",
"Saluki",
"Samoyed",
"Schipperke",
"Scottish Deerhound",
"Scottish Terrier",
"Sealyham Terrier",
"Shetland Sheepdog",
"Shiba Inu",
"Shih Tzu",
"Siberian Husky",
"Silky Terrier",
"Skye Terrier",
"Sloughi",
"Soft Coated Wheaten Terrier",
"Spanish Water Dog",
"Spinone Italiano",
"Springer Spaniel",
"Staffordshire Bull Terrier",
"Standard Schnauzer",
"Sussex Spaniel",
"Tibetan Mastiff",
"Tibetan Spaniel",
"Tibetan Terrier",
"Toy Fox Terrier",
"Vizsla",
"Weimaraner",
"Welsh Springer Spaniel",
"Welsh Terrier",
"West Highland White Terrier",
"Whippet",
"Wire Fox Terrier",
"Wirehaired Pointing Griffon",
"Xoloitzcuintli",
"Yorkshire Terrier",
"Boerboel",
"Africanis",
"Mixed Breed",
"Other"
];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-dogs')}
            className="mb-4"
            data-testid="button-back-to-dogs"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Dogs
          </Button>
          
          <div className="text-center">
            <Heart className="h-12 w-12 text-[hsl(24,100%,50%)] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Add New Dog
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Tell us about your furry family member
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dog Information</CardTitle>
            <CardDescription>
              Fill in the details about your dog. This information helps service providers better understand your pet's needs.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
             <FormField
  control={form.control}
  name="photoUrl"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Dog Photo URL (optional)</FormLabel>

      <FormControl>
        <Input
          placeholder="Paste an image URL"
          {...field}
        />
      </FormControl>

      <FormDescription>
Paste a link to a photo of your dog.
</FormDescription>

  <div className="mt-3">
  {form.watch("photoUrl") ? (
    <img
      src={form.watch("photoUrl")}
      alt="Dog preview"
      className="w-28 h-28 rounded-full object-cover border-2 border-gray-200"
    />
  ) : (
    <div className="w-28 h-28 rounded-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
  <Camera className="w-6 h-6 mb-1 opacity-70" />
  <span className="text-xs">Add Photo</span>
</div>
  )}
</div>    

    </FormItem>
  )}
/> 
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid gap-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dog's Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Buddy, Luna, Max"
                            {...field}
                            data-testid="input-dog-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Breed */}
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dog-breed">
                              <SelectValue placeholder="Select a breed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dogBreeds.map((breed) => (
                              <SelectItem key={breed} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the breed that best matches your dog
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gender and Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-dog-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-dog-size">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SMALL">Small</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="LARGE">Large</SelectItem>
                              <SelectItem value="XL">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Birth Date */}
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-birth-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <input
                              type="date"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              className="p-3 border rounded-md"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When was your dog born? This helps service providers understand your dog's age and needs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your dog's personality, special needs, favorite activities, behavioral notes, etc."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-dog-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Share anything that would help service providers better care for your dog
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/my-dogs")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || addDogMutation.isPending}
                    className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
                    data-testid="button-submit"
                  >
                    {isSubmitting || addDogMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Dog...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Add Dog
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}