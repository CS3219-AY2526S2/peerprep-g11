'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NavBar } from '@/components/ui/navBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboardPage() {
  const { user, isLoading } = useRequireAuth(Role.ADMIN);
  const [ loadingAction, setLoadingAction ] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      title: "",
      topics: "",
      diffuculty: "",
      description: "",
      examples: "",
      constraints: ""
    },
  })

  const handleAction = async (actionType: "Get" | "Upsert" | "Delete") => {
    setLoadingAction(actionType)
    const values = form.getValues()

    try {
      let payload = {}
      let endpoint = ""
      let method = ""

      switch (actionType) {
        case "Get":
          method = "GET"
          endpoint = "/api/questions/retrieve"
          payload = { "title": values.title }
          break;

        case "Upsert":
          method = "POST"
          endpoint = "/api/questions/upsert"
          payload = values
          break;

        case "Delete":
          method = "DELETE"
          endpoint = "/api/questions/delete"
          payload = { "title": values.title }
          break;
      }

      const response = await fetch(endpoint, {
        method, 
        headers: {"Content-Type": "applicaton/json"},
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Request failed")

      toast("Success", {
        description: `${actionType} completed.`
      })
    } catch (error) {
      console.log("Hehe")
      toast("Error", {
        description: "Failed to process request."
      })
    } finally {
      setLoadingAction(null)
    }
  } 

  useEffect(() => {
    // Don't fetch until auth is resolved
    if (isLoading || !user) return;
  }, [isLoading, user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <div className="pt-20 px-10 max-w-[1000px] mx-auto">
        <Card className="border-border shadow-[var(--shadow)]">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-[15px] font-semibold"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <form>
              <FieldGroup>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Title</FieldLabel>
                      <Input
                        id='title'
                        placeholder='Enter your title here'
                        required
                      />
                      <FieldDescription>Alphanumeric characters only.</FieldDescription>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Topics</FieldLabel>
                        <Input
                          id='topics'
                          placeholder='Array, Hashmap, ...'
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Difficulty</FieldLabel>
                        <Select>
                          <SelectTrigger>
                            <SelectValue id="difficulty" placeholder="Choose difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value='easy'>Easy</SelectItem>
                              <SelectItem value='medium'>Medium</SelectItem>
                              <SelectItem value='hard'>Hard</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        id="description"
                        placeholder="Enter description here..."
                        rows={4}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Examples</FieldLabel>
                      <Textarea
                        id="examples"
                        placeholder="Enter examples here..."
                        rows={4}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Constraints</FieldLabel>
                      <Textarea
                        id="constraints"
                        placeholder="Enter constraint here..."
                        rows={4}
                      />
                    </Field>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        disabled={!!loadingAction}
                        onClick={() => handleAction("Get")}
                      >
                        
                        Retrieve
                      </Button>
                      <Button 
                        type="button" 
                        disabled={!!loadingAction}
                        onClick={() => handleAction("Upsert")}
                      >
                        {loadingAction === "Upsert"}
                        Save All
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive"
                        disabled={!!loadingAction}
                        onClick={() => handleAction("Delete")}
                      >
                        {loadingAction === "Delete"}
                        Delete
                      </Button>
                    </div>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
