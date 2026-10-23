import { useNavigate } from "react-router"
import { format, parse } from "date-fns"
import { toast } from "sonner"

import { addVisit } from "@/data/visit-store"
import { slotLabel, type Priority } from "@/data/operations"
import { ActivityIntake } from "@/pages/add-inspection"

/** Schedule a Visit: the Add Inspection form, saved as a visit on the Schedule a Visit list */
export function AddVisitPage() {
  const navigate = useNavigate()

  return (
    <ActivityIntake
      title="Add Visit"
      listLabel="Schedule a Visit"
      listPath="/visits"
      cardTitle="Schedule a Visit with an ELPREMAR"
      intro="Book an ELPREMAR to visit the selected location and inspect its electrical assets."
      submitLabel="Schedule Visit"
      untitled="New Visit"
      onSubmit={(values, elpremar) => {
        // TODO: POST /visits
        const visit = addVisit({
          plant: values.plant,
          area: values.area,
          assetTag: values.assetTag,
          asset: values.assetName,
          category: values.category,
          activities: values.activity ?? [],
          date: values.date,
          time: values.time,
          duration: values.duration ?? "",
          elpremar: elpremar.name,
          priority: values.priority as Priority,
          description: values.description,
        })
        toast.success(`${visit.id} scheduled with ${elpremar.name}`, {
          description: `${format(parse(values.date, "yyyy-MM-dd", new Date()), "d MMM yyyy")}, ${slotLabel(visit.slot)}`,
        })
        navigate("/visits")
      }}
    />
  )
}
