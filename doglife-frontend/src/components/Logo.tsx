import logo from "@/assets/doglife-logo.jpeg";

export default function Logo({ className = "h-12 w-auto" }) {
  return (
    <img
      src={logo}
      alt="DogLife"
      className={className}
    />
  );
}