import { getAllHosts, getAllPathnames } from "@/lib/db";
import { Heading } from "@/components/ui/heading";
import AddHostForm from "@/components/AddHostForm";
import HostList from "@/components/HostList";
import AddPathnameForm from "@/components/AddPathnameForm";
import PathnameList from "@/components/PathnameList";

export const revalidate = 0;

export default async function ConfigurationPage() {
  const hosts = await getAllHosts();
  const pathnames = await getAllPathnames();

  return (
    <>
      <Heading level={1} className="mb-8">
        Configuration
      </Heading>

      <div className="grid gap-8 md:grid-cols-2 mb-12">
        <AddHostForm />
        <HostList hosts={hosts} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <AddPathnameForm />
        <PathnameList pathnames={pathnames} />
      </div>
    </>
  );
}
