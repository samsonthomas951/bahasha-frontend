import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const period = h < 12 ? 'AM' : 'PM'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { value: h, label: `${display}:00 ${period}` }
})

export default function ProfilePage() {
  const { user, updateProfileMutation, changePasswordMutation, deleteAccountMutation } = useAuth()

  const [reportFrequency, setReportFrequency] = useState(user?.report_frequency ?? 'weekly')
  const [dispatchHour, setDispatchHour] = useState<number>(user?.report_dispatch_hour ?? 16)
  const [recipientsRaw, setRecipientsRaw] = useState(
    Array.isArray(user?.report_recipients)
      ? user.report_recipients.join(', ')
      : (user?.report_recipients as string | undefined) ?? '',
  )

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateProfileMutation.mutate({
      report_frequency: reportFrequency,
      report_dispatch_hour: dispatchHour,
      report_recipients: recipientsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    changePasswordMutation.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setPasswordError(msg ?? 'Failed to update password')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account settings" />

      <div className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="space-y-1">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              {changePasswordMutation.isSuccess && (
                <p className="text-sm text-green-600">Password updated successfully</p>
              )}
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="space-y-1">
                <Label>Report Frequency</Label>
                <Select value={reportFrequency} onValueChange={setReportFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Preferred Dispatch Time (Africa/Nairobi)</Label>
                <Select
                  value={String(dispatchHour)}
                  onValueChange={(v) => setDispatchHour(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="recipients">Report Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  value={recipientsRaw}
                  onChange={(e) => setRecipientsRaw(e.target.value)}
                  placeholder="admin@church.org, pastor@church.org"
                />
              </div>
              {updateProfileMutation.isError && (
                <p className="text-sm text-destructive">Failed to update profile</p>
              )}
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Delete Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently deletes your account, all churches you own, their Google Sheets, members, donations, and campaigns. This cannot be undone.
            </p>
            <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeletePassword('') }}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete My Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This will permanently erase your account and all associated data — churches, Google Sheets, members, donations, and campaigns. There is no recovery.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1 py-2">
                  <Label htmlFor="delete-password">Confirm your password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                {deleteAccountMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(deleteAccountMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete account'}
                  </p>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate(deletePassword || undefined)}
                  >
                    {deleteAccountMutation.isPending ? 'Deleting…' : 'Yes, delete everything'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
