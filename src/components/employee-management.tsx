import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Edit, Trash2, Mail, Phone, Briefcase } from "lucide-react";

interface Employee {
  id: number;
  providerId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
}

interface EmployeeManagementProps {
  providerId: number;
}

const employeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeManagement({ providerId }: EmployeeManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${providerId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      position: "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => 
      apiRequest("POST", "/api/employees", { ...data, providerId }),
    onSuccess: () => {
      toast({ title: "Employee added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", providerId] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormData & { id: number }) =>
      apiRequest("PATCH", `/api/employees/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Employee updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", providerId] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (employeeId: number) =>
      apiRequest("DELETE", `/api/employees/${employeeId}`),
    onSuccess: () => {
      toast({ title: "Employee removed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", providerId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ ...data, id: editingEmployee.id });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || "",
      phoneNumber: employee.phoneNumber || "",
      position: employee.position || "",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleDelete = (employeeId: number) => {
    if (confirm("Are you sure you want to remove this employee?")) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Management
          </h2>
          <p className="text-gray-600">Manage your employees and their schedules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Dog Walker, Trainer, Assistant" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingEmployee ? "Update" : "Add"} Employee
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Team ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
              <p className="text-gray-500 mb-4">
                Add your first team member to start managing schedules and assignments.
              </p>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Employee
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee: Employee) => (
                <div key={employee.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        {employee.position && (
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {employee.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{employee.email}</span>
                      </div>
                    )}
                    {employee.phoneNumber && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{employee.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Member since {new Date(employee.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}