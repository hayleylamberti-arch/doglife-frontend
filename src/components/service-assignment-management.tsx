import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, Plus, Trash2, Settings, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceAssignmentManagementProps {
  providerId: number;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  isActive: boolean;
}

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
}

interface ServiceAssignment {
  id: number;
  employeeId: number;
  serviceId: number;
  isActive: boolean;
  employee: Employee;
  service: Service;
}

interface EmployeeSchedule {
  id: number;
  serviceAssignmentId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export default function ServiceAssignmentManagement({ providerId }: ServiceAssignmentManagementProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch service assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<ServiceAssignment[]>({
    queryKey: [`/api/service-assignments/provider/${providerId}`],
  });

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
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

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: [`/api/services/provider/${providerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/services/provider/${providerId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
  });

  // Create service assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: { employeeId: number; serviceId: number }) => {
      console.log("Creating assignment with data:", data);
      return apiRequest("POST", `/api/service-assignments`, data);
    },
    onSuccess: (data) => {
      console.log("Assignment created successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/service-assignments/provider/${providerId}`] });
      setShowAssignmentDialog(false);
      setSelectedEmployee(null);
      setSelectedService(null);
      toast({
        title: "Success",
        description: "Service assignment created successfully",
      });
    },
    onError: (error) => {
      console.error("Assignment creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create service assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete service assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      apiRequest("DELETE", `/api/service-assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-assignments/provider/${providerId}`] });
      toast({
        title: "Success",
        description: "Service assignment removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove service assignment",
        variant: "destructive",
      });
    },
  });

  const handleCreateAssignment = () => {
    console.log("handleCreateAssignment called");
    console.log("selectedEmployee:", selectedEmployee);
    console.log("selectedService:", selectedService);
    
    if (!selectedEmployee || !selectedService) {
      console.log("Missing employee or service selection");
      return;
    }
    
    console.log("About to call createAssignmentMutation.mutate");
    createAssignmentMutation.mutate({
      employeeId: selectedEmployee,
      serviceId: selectedService,
    });
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    if (confirm("Are you sure you want to remove this service assignment?")) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const openScheduleDialog = (assignment: ServiceAssignment) => {
    setSelectedAssignment(assignment);
    setShowScheduleDialog(true);
  };

  // Group assignments by employee
  const assignmentsByEmployee = assignments.reduce((acc: any, assignment: ServiceAssignment) => {
    const employeeId = assignment.employee.id;
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee: assignment.employee,
        assignments: [],
      };
    }
    acc[employeeId].assignments.push(assignment);
    return acc;
  }, {});

  // Debug logging
  console.log("Employees data:", employees);
  console.log("Employees loading:", employeesLoading);
  console.log("Employees error:", employeesError);
  console.log("Services data:", services);

  if (assignmentsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-doglife-dark">Service Assignments</h2>
          <p className="text-doglife-neutral">Assign team members to specific services and manage their schedules</p>
        </div>
        <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
          <DialogTrigger asChild>
            <Button className="bg-doglife-primary hover:bg-doglife-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Assign Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Employee to Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee</label>
                <Select onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: Employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <Select onValueChange={(value) => setSelectedService(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: Service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateAssignment}
                  disabled={!selectedEmployee || !selectedService || createAssignmentMutation.isPending}
                  className="flex-1"
                >
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
                <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(assignmentsByEmployee).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Assignments</h3>
            <p className="text-gray-500 text-center mb-4">
              Start by assigning your team members to specific services they can provide.
            </p>
            <Button 
              onClick={() => setShowAssignmentDialog(true)}
              className="bg-doglife-primary hover:bg-doglife-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(assignmentsByEmployee).map((group: any) => (
            <Card key={group.employee.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {group.employee.firstName} {group.employee.lastName}
                    </CardTitle>
                    <p className="text-sm text-doglife-neutral">{group.employee.position}</p>
                  </div>
                  <Badge variant={group.employee.isActive ? "default" : "secondary"}>
                    {group.employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-doglife-neutral">
                    <Users className="h-4 w-4" />
                    Assigned to {group.assignments.length} service{group.assignments.length !== 1 ? 's' : ''}
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.assignments.map((assignment: ServiceAssignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.service.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {assignment.service.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {assignment.service.duration} min
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.isActive ? "default" : "secondary"}>
                              {assignment.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openScheduleDialog(assignment)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Schedule
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                disabled={deleteAssignmentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Management Dialog */}
      {selectedAssignment && (
        <ScheduleManagementDialog
          assignment={selectedAssignment}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
        />
      )}
    </div>
  );
}

interface ScheduleManagementDialogProps {
  assignment: ServiceAssignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ScheduleManagementDialog({ assignment, open, onOpenChange }: ScheduleManagementDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch schedules for this assignment
  const { data: schedules = [], isLoading } = useQuery<EmployeeSchedule[]>({
    queryKey: [`/api/employee-schedules/assignment/${assignment.id}`],
    enabled: open,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Creating schedule with data:", data);
      return apiRequest("POST", `/api/employee-schedules`, data);
    },
    onSuccess: (data) => {
      console.log("Schedule created successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/employee-schedules/assignment/${assignment.id}`] });
      toast({
        title: "Success",
        description: "Working hours added successfully",
      });
    },
    onError: (error) => {
      console.error("Schedule creation error:", error);
      // Only show error if it's a real failure, not a success with wrong status
      if (error.message && !error.message.includes('201')) {
        toast({
          title: "Error",
          description: `Failed to create schedule: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: number) =>
      apiRequest("DELETE", `/api/employee-schedules/${scheduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/employee-schedules/assignment/${assignment.id}`] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
  });

  const handleCreateSchedule = (dayOfWeek: number, startTime: string, endTime: string) => {
    console.log("handleCreateSchedule called with:", { dayOfWeek, startTime, endTime });
    
    // Validate time format (HH:MM) - HTML time input provides HH:MM format
    if (!startTime || !endTime) {
      console.log("Missing time values");
      toast({
        title: "Missing Time",
        description: "Please select both start and end times",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure start time is before end time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      console.log("Invalid time range");
      toast({
        title: "Invalid Time Range",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }
    
    console.log("About to call createScheduleMutation.mutate");
    createScheduleMutation.mutate({
      serviceAssignmentId: assignment.id,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: true,
    });
  };

  const handleSubmitTimeForm = () => {
    if (!startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please enter both start and end times",
        variant: "destructive",
      });
      return;
    }
    
    // Close form immediately to prevent duplicate submissions
    setShowTimeForm(false);
    const currentStartTime = startTime;
    const currentEndTime = endTime;
    const currentSelectedDay = selectedDay;
    
    // Clear form state
    setStartTime('');
    setEndTime('');
    
    // Create schedule
    handleCreateSchedule(currentSelectedDay, currentStartTime, currentEndTime);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Schedule for {assignment.employee.firstName} {assignment.employee.lastName} - {assignment.service.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-4">
            {DAYS_OF_WEEK.map((day, index) => {
              const daySchedules = schedules.filter((s: EmployeeSchedule) => s.dayOfWeek === index);
              
              return (
                <Card key={day} className="min-h-32">
                  <CardHeader className="pb-2">
                    <h4 className="font-medium text-sm">{day}</h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySchedules.map((schedule: EmployeeSchedule) => (
                      <div key={schedule.id} className="bg-doglife-primary/10 p-2 rounded text-xs">
                        <div className="font-medium">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 mt-1"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        setSelectedDay(index);
                        setShowTimeForm(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        {/* Time Input Form */}
        {showTimeForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Add Working Hours for {DAYS_OF_WEEK[selectedDay]}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-doglife-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-doglife-primary"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSubmitTimeForm} 
                    className="flex-1"
                    disabled={createScheduleMutation.isPending}
                  >
                    {createScheduleMutation.isPending ? "Adding..." : "Add Schedule"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowTimeForm(false);
                      setStartTime('');
                      setEndTime('');
                    }}
                    disabled={createScheduleMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}