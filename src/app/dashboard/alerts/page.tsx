'use client'
import { Button, Card, ColorInput, SimpleGrid, Skeleton } from "@mantine/core";
import { useForm } from '@mantine/form';
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect } from "react";
import { AlertTemplate } from "@/components/alert-template";
import { notifications } from '@mantine/notifications';
export default function Page() {
    const alerts = useQuery(api.alert.byUserId, {
        userId: localStorage.getItem("user_id") as Id<"users">
    });
    const createAlert = useMutation(api.alert.create);
    return (
        <>
            <Button onClick={() => createAlert({
                userId: localStorage.getItem("user_id") as Id<"users">
            })}>Добавить оповещение</Button>
            <SimpleGrid mt={'md'} cols={{ sm: 1, md: 2, lg: 3 }}
                spacing={{ base: 10, sm: 'xl' }}
                verticalSpacing={{ base: 'md', sm: 'xl' }}>
                {alerts ? alerts?.map((alert) => (
                    <AlertCard key={alert._id} {...alert} />
                )) : (
                    <>
                        {[1, 2, 3].map((i) => (
                            <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
                                <Card.Section>
                                    <Skeleton height={150} radius={0} />
                                </Card.Section>
                                <SimpleGrid cols={2} mt="md">
                                    <Skeleton height={36} mt="sm" />
                                    <Skeleton height={36} mt="sm" />
                                </SimpleGrid>
                                <Skeleton height={36} mt="md" width="40%" />
                            </Card>
                        ))}
                    </>
                )}
            </SimpleGrid>
        </>
    )
}

function AlertCard(initialValues: Doc<"alerts">) {
    const form = useForm({
        initialValues: {
            _id: initialValues._id,
            _creationTime: initialValues._creationTime,
            backgroundColor: initialValues.backgroundColor,
            textColor: initialValues.textColor ,
            userId: initialValues.userId,
        },
    });
    const updateAlert = useMutation(api.alert.update);
    const deleteAlert = useMutation(api.alert.remove);

    const [debouncedValues] = useDebouncedValue(form.values, 500);

    useEffect(() => {
        async function update() {
            if (
                debouncedValues.backgroundColor !== initialValues.backgroundColor ||
                debouncedValues.textColor !== initialValues.textColor
            ) {
                try {
                    await updateAlert({
                        id: initialValues._id,
                        backgroundColor: debouncedValues.backgroundColor,
                        textColor: debouncedValues.textColor,
                        userId: localStorage.getItem("user_id") as Id<"users">
                    });
                    notifications.show({
                        title: "Оповещение обновлено",
                        message: "Оповещение обновлено успешно",
                        color: "green"
                    });
                } catch (error) {
                    notifications.show({
                        title: "Ошибка",
                        message: "Ошибка при обновлении оповещения" + error,
                        color: "red"
                    });
                }
            }
        }
        update();
    }, [
        debouncedValues
    ]);

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <AlertTemplate {...form.values} name="Template" message="Template" amount={1000} />
            </Card.Section>
            <SimpleGrid cols={2} mt="md">
                <ColorInput description="Цвет фона" key={form.key('backgroundColor')} {...form.getInputProps('backgroundColor')} />
                <ColorInput description="Цвет текста" key={form.key('textColor')} {...form.getInputProps('textColor')} />
            </SimpleGrid>
            <Button variant="outline" color="red" mt="md" onClick={() => deleteAlert({ id: initialValues._id })}>Удалить</Button>
        </Card>
    )
}
