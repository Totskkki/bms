"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CameraIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilmIcon,
  ImageIcon,
  PlayIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"
import { filterByScope } from "@/lib/rbac"

import {
  DashboardGreetingHeader,
  EmptyBox,
  ExportButtons,
  FileDropzone,
  Grid,
  Panel,
  PriorityBadge,
  Stat,
  TablePagination,
  TaskStatusBadge,
  usePagination,
} from "../parts"
import { DepartmentReportsPage } from "../shared/report-center"
import { useBiz, type Activity, type MediaAttachment } from "../store"

export function ReporterOverviewPage() {
  const s = useBiz()
  const myTasks = useMemo(() => filterByScope(s.tasks, s.currentUser), [s.tasks, s.currentUser])
  const myActivities = useMemo(() => filterByScope(s.activities, s.currentUser), [s.activities, s.currentUser])
  const myAttendance = useMemo(() => filterByScope(s.attendance, s.currentUser), [s.attendance, s.currentUser])
  const todayRec = myAttendance.find((a) => a.date === "2026-11-26")

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`${myTasks.filter((t) => t.status !== "done").length} open assignments · ${myActivities.length} activities this month`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            {!todayRec ? (
              <Button
                size="sm"
                onClick={() => {
                  const res = s.timeIn()
                  toast.add({ title: res.ok ? "Timed in for today" : res.error })
                }}
              >
                <ClockIcon className="size-4" />
                Time in
              </Button>
            ) : !todayRec.timeOut ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const res = s.timeOut()
                  toast.add({ title: res.ok ? "Timed out for today" : res.error })
                }}
              >
                <ClockIcon className="size-4" />
                Time out
              </Button>
            ) : (
              <StatusBadge tone="success">Shift completed</StatusBadge>
            )}
          </div>
        }
      />

      <Grid>
        <Stat title="Open assignments" value={String(myTasks.filter((t) => t.status !== "done").length)} caption="Assigned by Manager" />
        <Stat title="Attendance today" value={todayRec ? (todayRec.timeOut ? "Completed" : "Timed in") : "Not timed in"} caption={todayRec ? `In: ${todayRec.timeIn}` : "Click Time in above"} />
        <Stat title="My activities" value={String(myActivities.length)} caption="This month" />
        <Stat title="My photos" value={String(filterByScope(s.photos, s.currentUser).length)} caption="Documented entries" />
      </Grid>

      <Grid cols={2}>
        <Panel title="Today's field assignments">
          {myTasks.length === 0 ? (
            <EmptyBox title="No assignments yet" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {myTasks.map((t) => (
                <div key={t.id} className="flex flex-col gap-1.5 rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <TaskStatusBadge status={t.status} />
                    <span className="text-muted-foreground">Due {t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent activity">
          {myActivities.length === 0 ? (
            <EmptyBox title="No activities logged yet" />
          ) : (
            <ul className="divide-y">
              {myActivities.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.place} · {a.date} · {a.photos} photos</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Grid>
    </div>
  )
}

const activitySchema = z.object({
  title: z.string().min(3, "Title is required"),
  place: z.string().min(2, "Location is required"),
  notes: z.string().min(5, "Brief notes are required"),
  photos: z.coerce.number().min(0, "Cannot be negative"),
  date: z.string().min(4, "Date is required"),
})

export function ReporterActivitiesPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<MediaAttachment[]>([])
  const [viewingMedia, setViewingMedia] = useState<Activity | null>(null)

  const form = useForm<z.input<typeof activitySchema>, unknown, z.output<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: { title: "", place: "", notes: "", photos: 0, date: "2026-11-26" },
  })

  const mine = useMemo(
    () =>
      filterByScope(s.activities, s.currentUser).filter(
        (a) => !search.trim() || a.title.toLowerCase().includes(search.trim().toLowerCase()) || a.place.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [s.activities, s.currentUser, search]
  )
  const actPg = usePagination(mine, 10)

  function handleFilesSelected(files: File[]) {
    if (files.length === 0) return
    const next: MediaAttachment[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video/") ? "video" : "image",
    }))
    setMedia((prev) => {
      const merged = [...prev, ...next]
      form.setValue("photos", merged.length)
      return merged
    })
  }

  function removeMedia(id: string) {
    setMedia((prev) => {
      const updated = prev.filter((m) => m.id !== id)
      form.setValue("photos", updated.length)
      return updated
    })
  }

  const onSubmit = form.handleSubmit((values) => {
    const res = s.addActivity({ ...values, media })
    toast.add({
      title: res.ok
        ? media.length > 0
          ? `Activity logged with ${media.length} media ${media.length === 1 ? "file" : "files"}`
          : "Daily activity logged"
        : res.error,
    })
    if (res.ok) {
      form.reset({ title: "", place: "", notes: "", photos: 0, date: "2026-11-26" })
      setMedia([])
      setOpen(false)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daily Activity Reports"
        description="Log your field visits, interviews, locations, and upload photos or videos."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <ExportButtons
              filename="daily-activities"
              headers={["Title", "Location", "Date", "Media Count", "Notes"]}
              rows={mine.map((a) => [a.title, a.place, a.date, a.photos, a.notes])}
            />
            <Button
              size="sm"
              onClick={() => {
                setMedia([])
                setOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              Log activity
            </Button>
          </div>
        }
      />

      <Input placeholder="Search activity or location…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs print:hidden" />

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {mine.length === 0 ? (
            <EmptyBox title="No activities logged" description="Log your first daily field activity." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Photos / Videos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actPg.items.map((a) => {
                  const hasUploads = (a.media?.length ?? 0) > 0
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.place}</TableCell>
                      <TableCell className="text-muted-foreground">{a.date}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{a.notes}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums">
                        {hasUploads ? (
                          <Button size="xs" variant="outline" onClick={() => setViewingMedia(a)}>
                            <ImageIcon className="size-3.5" />
                            View ({a.media!.length})
                          </Button>
                        ) : (
                          <span>{a.photos}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...actPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log daily activity</DialogTitle>
            <DialogDescription>Record field coverage details and attach photos or videos from your device.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-title">Activity title</Label>
              <Input id="a-title" {...form.register("title")} placeholder="e.g. Barangay council briefing" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="a-place">Location</Label>
                <Input id="a-place" {...form.register("place")} placeholder="Koronadal City" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="a-date">Date</Label>
                <Input id="a-date" type="date" {...form.register("date")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-media">Photos & videos</Label>
              <FileDropzone
                id="a-media"
                accept="image/*,video/*"
                multiple
                hint="PNG, JPG, WebP, MP4, MOV · Multiple files allowed"
                onFiles={handleFilesSelected}
              />
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {media.map((item) => (
                    <div key={item.id} className="relative overflow-hidden rounded-lg border bg-muted/30">
                      {item.mediaType === "video" ? (
                        <video src={item.url} className="h-20 w-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={item.name} className="h-20 w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium">
                        {item.mediaType === "video" ? "Video" : "Photo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMedia(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Uploaded photos and videos also appear in Photos & Documentation automatically.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-notes">Field notes</Label>
              <Textarea id="a-notes" rows={3} {...form.register("notes")} placeholder="Summary of interviews, observations, or highlights…" />
              {form.formState.errors.notes && <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingMedia} onOpenChange={(o) => !o && setViewingMedia(null)}>
        <DialogContent className="max-w-2xl">
          {viewingMedia && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingMedia.title}</DialogTitle>
                <DialogDescription>
                  {viewingMedia.place} · {viewingMedia.date}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {(viewingMedia.media ?? []).map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border bg-muted/20">
                    {item.mediaType === "video" ? (
                      <video src={item.url} controls className="h-48 w-full bg-black object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.name} className="h-48 w-full object-cover" />
                    )}
                    <p className="truncate px-3 py-2 text-xs text-muted-foreground">{item.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ReporterAssignmentsPage() {
  const s = useBiz()
  const myTasks = useMemo(() => filterByScope(s.tasks, s.currentUser), [s.tasks, s.currentUser])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Field Assignments"
        description="Assignments dispatched by your Manager. Accept, update progress, and mark complete."
      />

      {myTasks.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="No field assignments" description="Tasks assigned to you by the Manager will appear here." />
          </div>
        </Widget>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myTasks.map((t) => (
            <Widget key={t.id}>
              <div className="flex flex-col gap-3 px-(--card-spacing)">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">Assigned by {t.assignedBy} · Due {t.dueDate}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <TaskStatusBadge status={t.status} />
                  <div className="flex items-center gap-2">
                    {t.status === "todo" && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          const res = s.updateTaskStatus(t.id, "in_progress")
                          toast.add({ title: res.ok ? "Assignment accepted" : res.error })
                        }}
                      >
                        <PlayIcon className="size-3.5" />
                        Accept
                      </Button>
                    )}
                    {t.status !== "done" && (
                      <Button
                        size="xs"
                        onClick={() => {
                          const res = s.updateTaskStatus(t.id, "done")
                          toast.add({ title: res.ok ? "Assignment marked complete" : res.error })
                        }}
                      >
                        <CheckCircle2Icon className="size-3.5" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Widget>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReporterAccomplishmentsPage() {
  const s = useBiz()
  const myActivities = filterByScope(s.activities, s.currentUser)
  const completedTasks = filterByScope(s.tasks, s.currentUser).filter((t) => t.status === "done")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accomplishments"
        description="Your monthly field coverage count and completed deliverables."
      />

      <Grid cols={3}>
        <Stat title="Activities this month" value={String(myActivities.length)} caption="Field reports logged" />
        <Stat title="Completed assignments" value={String(completedTasks.length)} caption="Manager tasks finished" />
        <Stat title="Total photos" value={String(myActivities.reduce((a, b) => a + b.photos, 0))} caption="Documented field shots" />
      </Grid>

      <Panel title="Logged accomplishments">
        {myActivities.length === 0 ? (
          <EmptyBox title="No accomplishments yet" />
        ) : (
          <ul className="divide-y">
            {myActivities.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.place} · {a.notes}</p>
                </div>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

const photoSchema = z.object({
  caption: z.string().min(3, "Caption is required"),
  location: z.string().min(2, "Location is required"),
  date: z.string().min(4, "Date is required"),
})

export function ReporterPhotosPage() {
  const s = useBiz()
  const [open, setOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<MediaAttachment[]>([])

  const form = useForm<z.infer<typeof photoSchema>>({
    resolver: zodResolver(photoSchema),
    defaultValues: { caption: "", location: "", date: "2026-11-26" },
  })

  const mine = useMemo(() => filterByScope(s.photos, s.currentUser), [s.photos, s.currentUser])

  function handleSelectFiles(files: File[]) {
    if (files.length === 0) return
    const next: MediaAttachment[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video/") ? "video" : "image",
    }))
    setSelectedFiles((prev) => [...prev, ...next])
  }

  const onSubmit = form.handleSubmit((values) => {
    if (selectedFiles.length === 0) {
      const fallbackSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><rect width='640' height='400' fill='#ea580c' fill-opacity='0.15'/><text x='320' y='205' text-anchor='middle' font-family='sans-serif' font-size='22' fill='#ea580c'>${values.caption}</text></svg>`
      )}`
      const res = s.addPhoto({ ...values, url: fallbackSvg, mediaType: "image" })
      toast.add({ title: res.ok ? "Photo uploaded to gallery" : res.error })
      if (res.ok) {
        form.reset()
        setOpen(false)
      }
      return
    }

    let okCount = 0
    let lastError = ""
    selectedFiles.forEach((item, idx) => {
      const caption =
        selectedFiles.length === 1 ? values.caption : `${values.caption} (${idx + 1}/${selectedFiles.length})`
      const res = s.addPhoto({
        caption,
        location: values.location,
        date: values.date,
        url: item.url,
        mediaType: item.mediaType,
      })
      if (res.ok) okCount += 1
      else lastError = res.error
    })

    toast.add({
      title:
        okCount > 0
          ? `Uploaded ${okCount} ${okCount === 1 ? "file" : "files"} to gallery`
          : lastError || "Upload failed",
    })
    if (okCount > 0) {
      form.reset()
      setSelectedFiles([])
      setOpen(false)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Photos & Documentation"
        description="Upload multiple field photos and videos from your device (stored in memory for this session)."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setSelectedFiles([])
              setOpen(true)
            }}
          >
            <UploadIcon className="size-4" />
            Upload photos / videos
          </Button>
        }
      />

      {mine.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="No media uploaded yet" description="Upload photos or videos from your device to document your field coverage." />
          </div>
        </Widget>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((p) => (
            <Widget key={p.id} className="overflow-hidden pt-0">
              {p.mediaType === "video" ? (
                <video src={p.url} controls className="h-44 w-full bg-black object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.caption} className="h-44 w-full object-cover" />
              )}
              <div className="flex flex-col gap-1 px-(--card-spacing)">
                <div className="flex items-center gap-1.5">
                  {p.mediaType === "video" && <FilmIcon className="size-3.5 shrink-0 text-primary" />}
                  <p className="truncate font-medium leading-snug">{p.caption}</p>
                </div>
                <p className="text-xs text-muted-foreground">{p.location} · {p.date}</p>
              </div>
            </Widget>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload field photos or videos</DialogTitle>
            <DialogDescription>Select one or more image/video files from your device and add a caption.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-file">Photos or videos</Label>
              <FileDropzone
                id="p-file"
                accept="image/*,video/*"
                multiple
                hint="PNG, JPG, WebP, MP4, MOV · Select or drop multiple files"
                onFiles={handleSelectFiles}
              />
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {selectedFiles.map((item) => (
                    <div key={item.id} className="relative overflow-hidden rounded-lg border bg-muted/30">
                      {item.mediaType === "video" ? (
                        <video src={item.url} className="h-20 w-full bg-black object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={item.name} className="h-20 w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium">
                        {item.mediaType === "video" ? "Video" : "Photo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles((prev) => prev.filter((f) => f.id !== item.id))}
                        aria-label={`Remove ${item.name}`}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-cap">Caption</Label>
              <Input id="p-cap" {...form.register("caption")} placeholder="e.g. Barangay health drive interview" />
              {form.formState.errors.caption && <p className="text-xs text-destructive">{form.formState.errors.caption.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-loc">Location</Label>
                <Input id="p-loc" {...form.register("location")} placeholder="Koronadal City" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-date">Date</Label>
                <Input id="p-date" type="date" {...form.register("date")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">
                <CameraIcon className="size-4" />
                Save {selectedFiles.length > 1 ? `${selectedFiles.length} files` : "media"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ReporterAttendancePage() {
  const s = useBiz()
  const mine = useMemo(() => filterByScope(s.attendance, s.currentUser), [s.attendance, s.currentUser])
  const attPg = usePagination(mine, 10)
  const todayRec = mine.find((a) => a.date === "2026-11-26")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Daily time-in/time-out and your monthly attendance log."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              size="sm"
              disabled={!!todayRec}
              onClick={() => {
                const res = s.timeIn()
                toast.add({ title: res.ok ? "Timed in successfully" : res.error })
              }}
            >
              Time in
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!todayRec || !!todayRec.timeOut}
              onClick={() => {
                const res = s.timeOut()
                toast.add({ title: res.ok ? "Timed out successfully" : res.error })
              }}
            >
              Time out
            </Button>
          </div>
        }
      />

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {mine.length === 0 ? (
            <EmptyBox title="No attendance records yet" description="Click Time in to start your shift." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attPg.items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.date}</TableCell>
                    <TableCell className="font-sans tabular-nums">{a.timeIn}</TableCell>
                    <TableCell className="font-sans tabular-nums text-muted-foreground">{a.timeOut ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={a.status === "completed" ? "success" : "info"} className="capitalize">
                        {a.status}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...attPg.pagination} />
        </div>
      </Widget>
    </div>
  )
}

export function ReporterReportsPage() {
  return (
    <DepartmentReportsPage
      title="Reporter Reports"
      description="Submit daily, weekly, and monthly coverage reports to the Manager."
      allowedKinds={["daily", "weekly", "monthly"]}
    />
  )
}
