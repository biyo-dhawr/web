import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Register() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return null;
}
