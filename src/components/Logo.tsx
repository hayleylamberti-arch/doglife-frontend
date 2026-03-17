import logo from "@/assets/doglife-logo.png";

export default function Logo({ className = "h-10 w-auto" }) {
  return (
    <img
      src={logo}
      alt="DogLife"
      className={className}
    />
  );
}