import { ExigirLogin } from "@/components/auth";

/** Area logada: toda pagina daqui exige autenticacao. */
export default function LayoutArea({ children }: LayoutProps<"/">) {
  return <ExigirLogin>{children}</ExigirLogin>;
}
