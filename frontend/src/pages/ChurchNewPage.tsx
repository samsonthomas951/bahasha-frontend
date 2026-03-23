import { ChurchForm } from '@/components/churches/ChurchForm'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ChurchNewPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Create Your Church"
        description="Set up your church to start managing members, campaigns, and donations."
      />
      <ChurchForm />
    </div>
  )
}
