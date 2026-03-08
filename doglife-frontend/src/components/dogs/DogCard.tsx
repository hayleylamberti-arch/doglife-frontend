import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DogCard({ dog, onEdit, onDelete }: any) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition duration-200"
      onClick={() => navigate(`/dogs/${dog.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{dog.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex items-center gap-5">
        
        {/* Dog Avatar */}
        {dog.profileImageUrl ? (
          <img
            src={dog.profileImageUrl}
            alt={dog.name}
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gray-100 text-4xl border">
            🐶
          </div>
        )}

        {/* Dog Info */}
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {dog.breed || "Mixed breed"}
          </p>

          <p className="text-sm text-gray-500">{dog.size}</p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dog.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}