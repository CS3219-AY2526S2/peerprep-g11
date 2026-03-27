'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AdminQuestionFormValues, QuestionExample } from '@/app/questions/types';
import { normalizeTopicValue } from './question-form-utils';

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

interface AdminQuestionFormFieldsProps {
  form: UseFormReturn<AdminQuestionFormValues>;
  values: AdminQuestionFormValues;
  availableTopics: string[];
  isCheckingDuplicate?: boolean;
  onTitleBlur?: (title: string) => unknown;
  titleReadOnly?: boolean;
  titleDescription?: string;
  titleFooter?: ReactNode;
  metaAlert?: ReactNode;
}

export function AdminQuestionFormFields({
  form,
  values,
  availableTopics,
  isCheckingDuplicate = false,
  onTitleBlur,
  titleReadOnly = false,
  titleDescription,
  titleFooter,
  metaAlert,
}: AdminQuestionFormFieldsProps) {
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [topicQuery, setTopicQuery] = useState('');

  const selectedTopics = useMemo(
    () => values.topics.map((topic) => topic.trim()).filter(Boolean),
    [values.topics]
  );

  const availableTopicOptions = useMemo(() => {
    const selected = new Set(selectedTopics.map(normalizeTopicValue));
    return availableTopics.filter((topic) => !selected.has(normalizeTopicValue(topic)));
  }, [availableTopics, selectedTopics]);

  const normalizedTopicQuery = normalizeTopicValue(topicQuery);
  const canCreateTopic = Boolean(
    normalizedTopicQuery &&
      !selectedTopics.some((topic) => normalizeTopicValue(topic) === normalizedTopicQuery) &&
      !availableTopics.some((topic) => normalizeTopicValue(topic) === normalizedTopicQuery)
  );

  function setTopics(nextTopics: string[]) {
    form.setValue('topics', nextTopics, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function addTopic(rawTopic: string) {
    const trimmed = rawTopic.trim();
    if (!trimmed) {
      return;
    }

    const normalized = normalizeTopicValue(trimmed);
    if (selectedTopics.some((topic) => normalizeTopicValue(topic) === normalized)) {
      setTopicQuery('');
      setTopicPickerOpen(false);
      return;
    }

    const existingCanonical =
      availableTopics.find((topic) => normalizeTopicValue(topic) === normalized) ?? trimmed;

    setTopics([...selectedTopics, existingCanonical]);
    setTopicQuery('');
    setTopicPickerOpen(false);
  }

  function removeTopic(topicToRemove: string) {
    const normalized = normalizeTopicValue(topicToRemove);
    const nextTopics = selectedTopics.filter((topic) => normalizeTopicValue(topic) !== normalized);
    setTopics(nextTopics);
  }

  function updateStringList(
    fieldName: 'constraints',
    index: number,
    value: string
  ) {
    const nextValues = [...form.getValues(fieldName)];
    nextValues[index] = value;
    form.setValue(fieldName, nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function addStringRow(fieldName: 'constraints') {
    const nextValues = [...form.getValues(fieldName), ''];
    form.setValue(fieldName, nextValues, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  function removeStringRow(fieldName: 'constraints', index: number) {
    const currentValues = form.getValues(fieldName);
    const nextValues =
      currentValues.length === 1
        ? ['']
        : currentValues.filter((_, currentIndex) => currentIndex !== index);

    form.setValue(fieldName, nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function updateExample(
    index: number,
    fieldName: keyof QuestionExample,
    value: string
  ) {
    const nextValues = [...form.getValues('examples')];
    nextValues[index] = {
      ...nextValues[index],
      [fieldName]: value,
    };

    form.setValue('examples', nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function addExample() {
    form.setValue(
      'examples',
      [...form.getValues('examples'), { input: '', output: '', explanation: '' }],
      {
        shouldDirty: true,
        shouldTouch: true,
      }
    );
  }

  function removeExample(index: number) {
    const currentValues = form.getValues('examples');
    const nextValues =
      currentValues.length === 1
        ? [{ input: '', output: '', explanation: '' }]
        : currentValues.filter((_, currentIndex) => currentIndex !== index);

    form.setValue('examples', nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionHeading
          title="Question Setup"
          description="Review the core metadata admins use to identify and organize the prompt."
        />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="self-start">
                <FormLabel className="text-[12.5px] font-medium text-foreground">Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="e.g. Two Sum Variations"
                    className="h-11 bg-background"
                    readOnly={titleReadOnly}
                    disabled={titleReadOnly}
                    onBlur={async (event) => {
                      field.onBlur();
                      await onTitleBlur?.(event.target.value);
                    }}
                  />
                </FormControl>
                <div className="min-h-5">
                  {titleDescription ? (
                    <FormDescription className="text-[12px]">{titleDescription}</FormDescription>
                  ) : null}
                  {isCheckingDuplicate ? (
                    <FormDescription className="text-[12px]">
                      Checking for existing titles...
                    </FormDescription>
                  ) : null}
                  {titleFooter}
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem className="self-start">
                <FormLabel className="text-[12.5px] font-medium text-foreground">
                  Difficulty
                </FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      'flex h-11 items-center gap-2.5 rounded-md border bg-background px-3 shadow-xs transition-all duration-200 ease-out',
                      difficultyOpen
                        ? 'border-accent/40 ring-2 ring-accent/10 shadow-md'
                        : 'border-input hover:border-ring/30 hover:shadow-md'
                    )}
                  >
                    <span className="text-[11.5px] font-semibold whitespace-nowrap text-muted-foreground">
                      Difficulty
                    </span>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      onOpenChange={setDifficultyOpen}
                    >
                      <SelectTrigger className="h-auto flex-1 border-none bg-transparent p-0 text-[12.5px] shadow-none focus:ring-0 focus-visible:border-transparent focus-visible:ring-0 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <div className="min-h-5">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        {metaAlert}

        <FormField
          control={form.control}
          name="topics"
          render={() => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <FormLabel className="text-[12.5px] font-medium text-foreground">Topics</FormLabel>
                  <FormDescription className="text-[12px]">
                    Pick from existing topics or add a new one.
                  </FormDescription>
                </div>
                <Popover open={topicPickerOpen} onOpenChange={setTopicPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Plus className="size-4" />
                      Add Topic
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[320px] p-0">
                    <Command shouldFilter>
                      <CommandInput
                        placeholder="Search topics..."
                        value={topicQuery}
                        onValueChange={setTopicQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No matching topics.</CommandEmpty>
                        {canCreateTopic ? (
                          <CommandGroup heading="Create">
                            <CommandItem value={`create-${topicQuery}`} onSelect={() => addTopic(topicQuery)}>
                              <Plus className="size-4 text-muted-foreground" />
                              Add &quot;{topicQuery.trim()}&quot;
                            </CommandItem>
                          </CommandGroup>
                        ) : null}
                        {availableTopicOptions.length > 0 ? (
                          <CommandGroup heading="Existing topics">
                            {availableTopicOptions.map((topic) => (
                              <CommandItem key={topic} value={topic} onSelect={() => addTopic(topic)}>
                                <Check className="size-4 text-transparent" />
                                {topic}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ) : null}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                {selectedTopics.length > 0 ? (
                  selectedTopics.map((topic) => (
                    <div
                      key={topic}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-1.5"
                    >
                      <span className="text-[13px] text-foreground">{topic}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeTopic(topic)}
                        className="text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove topic ${topic}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-3 text-[12.5px] text-muted-foreground">
                    Add at least one topic.
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeading
          title="Description"
          description="Write the full prompt exactly as candidates should read it in the question details page."
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[12.5px] font-medium text-foreground">Prompt</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Describe the problem, the expected output, and any clarifying assumptions."
                  className="min-h-[220px] resize-y bg-background"
                />
              </FormControl>
              <FormDescription className="text-[12px]">
                Line breaks are preserved in the question details view.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeading
          title="Constraints"
          description="Keep each constraint on its own line item so it stays easy to scan."
        />

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addStringRow('constraints')}
            className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="size-4" />
            Add Constraint
          </Button>
        </div>

        <div className="space-y-3">
          {values.constraints.map((_, index) => (
            <div key={`constraint-${index}`} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`constraints.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="e.g. 1 ≤ nums.length ≤ 10⁵"
                        className="h-11 bg-background"
                        onChange={(event) =>
                          updateStringList('constraints', index, event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeStringRow('constraints', index)}
                className="mt-1 text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove constraint ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            title="Examples"
            description="Add realistic input and output pairs. Explanation is optional."
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExample}
            className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="size-4" />
            Add Example
          </Button>
        </div>

        <div className="space-y-4">
          {values.examples.map((_, index) => (
            <div
              key={`example-${index}`}
              className="rounded-lg border border-border bg-background px-4 py-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-foreground">Example {index + 1}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeExample(index)}
                  className="border-border bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`examples.${index}.input`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12.5px] font-medium text-foreground">
                        Input
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder="e.g. nums = [2,7,11,15], target = 9"
                          className="min-h-[96px] resize-y bg-card"
                          onChange={(event) => updateExample(index, 'input', event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`examples.${index}.output`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12.5px] font-medium text-foreground">
                        Output
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder="e.g. [0,1]"
                          className="min-h-[96px] resize-y bg-card"
                          onChange={(event) => updateExample(index, 'output', event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`examples.${index}.explanation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12.5px] font-medium text-foreground">
                        Explanation
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Optional context that explains how the output is derived."
                          className="min-h-[120px] resize-y bg-card"
                          onChange={(event) =>
                            updateExample(index, 'explanation', event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
