import { Route } from "react-router-dom";
import OwnerLayout from "@/layouts/OwnerLayout";
import Landing from "@/pages/landing";
import Search from "@/pages/search";

export default function PublicRoutes() {
  return (
    <Route element={<OwnerLayout />}>
      <Route path="/" element={<Landing />} />
      <Route path="/search" element={<Search />} />
    </Route>
  );
}