import peopleData from "../../data/people.json";
import documentsData from "../../data/documents.json";
import { FamilyTreeViewer } from "../../components/tree/FamilyTreeViewer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Family Tree | The Living Red Book",
  description: "Interactive genealogical constellation across 7 historical epochs and 18 family branches."
};

export default function FamilyTreePage() {
  return <FamilyTreeViewer rawPeople={peopleData} documents={documentsData} />;
}
