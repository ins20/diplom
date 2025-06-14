'use client'
import { ActionIcon, Button, Card, CopyButton, NumberInput, Radio, SimpleGrid, Text, TextInput, Tooltip, Skeleton, Center, Loader, Group, Grid, Progress } from "@mantine/core";
import { Carousel } from '@mantine/carousel';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect } from 'react';
import classes from './page.module.css';
import { GoalTemplate } from "@/components/goal-template";
import { AlertTemplate } from "@/components/alert-template";
import { FaBell, FaCheck, FaFlag, FaTrash } from "react-icons/fa";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { notifications } from '@mantine/notifications';
import { Tabs } from '@mantine/core';
import Link from "next/link";

interface Target {
    _id: Id<"targets">;
    name: string;
    collected: number;
    total: number;
    userId: Id<"users">;
    goalId?: Id<"goals">;
    alertId?: Id<"alerts">;
}


export default function Page() {
    const targets = useQuery(api.target.byUserId, {
        userId: localStorage.getItem("user_id") as Id<"users">
    });
    const alerts = useQuery(api.alert.byUserId, {
        userId: localStorage.getItem("user_id") as Id<"users">
    });
    const goals = useQuery(api.goal.byUserId, {
        userId: localStorage.getItem("user_id") as Id<"users">
    });

    const allTargets = useQuery(api.target.get);
    const allUsers = useQuery(api.user.getAll);

    const createTarget = useMutation(api.target.create);



    if (!targets || !alerts || !goals || !allTargets || !allUsers) {
        return <Center>
            <Loader />
        </Center>
    }

    const targetsWithUsers = allTargets.map((target: Target) => ({
        ...target,
        user: allUsers.find((user: Doc<"users">) => user._id === target.userId)
    }));
    return (
        <>
            <Button onClick={() => createTarget({
                userId: localStorage.getItem("user_id") as Id<"users">
            })}>Новая цель</Button>
            <Tabs defaultValue="all" mt={'md'}>
                <Tabs.List>
                    <Tabs.Tab value="all">Все цели</Tabs.Tab>
                    <Tabs.Tab value="my">Мои цели</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="all">
                    <Grid mt={'md'}>
                    {targetsWithUsers.map((target) => {
                        const progress = target.total > 0 ? (target.collected / target.total) * 100 : 0;

                        return (
                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={target._id}>
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Card.Section withBorder inheritPadding py="xs">
                                        <Group justify="space-between">
                                            <Text fw={500}>{target.name}</Text>
                                            <Text size="sm" c="dimmed">
                                                {target.user?.name}
                                            </Text>
                                        </Group>
                                    </Card.Section>

                                    <Group mt="md" mb="xs">
                                        <Text>
                                            {target.collected} ₽ из {target.total} ₽
                                        </Text>
                                    </Group>

                                    <Progress value={progress} size="md" radius="xl" />

                                    <Button component={Link} href={`/${target._id}`} variant="light" color="blue" fullWidth mt="md" radius="md" >
                                        Пожертвовать
                                    </Button>
                                </Card>
                            </Grid.Col>
                        );
                    })}
                    </Grid>
                </Tabs.Panel>
                <Tabs.Panel value="my">
                    <SimpleGrid mt={'md'} cols={{ sm: 1, md: 2, lg: 3 }}
                        spacing={{ base: 10, sm: 'xl' }}
                        verticalSpacing={{ base: 'md', sm: 'xl' }}>
                        {targets ? targets?.map((target) => (
                            <GoalCard key={target._id} {...target} alerts={alerts ?? []} goals={goals ?? []} />
                        )) : (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
                                        <SimpleGrid cols={2} mt="md">
                                            <Skeleton height={36} width="70%" />
                                            <Skeleton height={36} width="30%" ml="auto" />
                                            <Skeleton height={36} mt="sm" />
                                            <Skeleton height={36} mt="sm" />
                                        </SimpleGrid>
                                        <Skeleton height={150} mt="md" radius="md" />
                                        <Skeleton height={150} mt="md" radius="md" />
                                    </Card>
                                ))}
                            </>
                        )}
                    </SimpleGrid>
                </Tabs.Panel>
            </Tabs>

        </>
    )
}


function GoalCard(initialValues: Doc<"targets"> & { alerts: Doc<"alerts">[], goals: Doc<"goals">[] }) {
    const form = useForm({
        initialValues: {
            _id: initialValues._id,
            _creationTime: initialValues._creationTime,
            name: initialValues.name,
            collected: initialValues.collected,
            total: initialValues.total,
            goalId: initialValues.goalId,
            alertId: initialValues.alertId,
        },
    });

    const [debouncedValues] = useDebouncedValue(form.values, 500);
    const updateTarget = useMutation(api.target.update);

    useEffect(() => {
        async function update() {
            if (
                debouncedValues.name !== initialValues.name ||
                debouncedValues.collected !== initialValues.collected ||
                debouncedValues.total !== initialValues.total ||
                debouncedValues.goalId !== initialValues.goalId ||
                debouncedValues.alertId !== initialValues.alertId
            ) {
                try {
                    await updateTarget({
                        id: initialValues._id,
                        name: debouncedValues.name,
                        collected: debouncedValues.collected,
                        total: debouncedValues.total,
                        goalId: debouncedValues.goalId as Id<"goals">,
                        alertId: debouncedValues.alertId as Id<"alerts">,
                        userId: localStorage.getItem("user_id") as Id<"users">
                    });
                    notifications.show({
                        title: "Цель обновлена",
                        message: "Цель обновлена успешно",
                        color: "green"
                    });
                } catch (error) {
                    notifications.show({
                        title: "Ошибка",
                        message: "Ошибка при обновлении цели" + error,
                        color: "red"
                    });
                }
            }
        }
        update();
    }, [debouncedValues]);

    const deleteTarget = useMutation(api.target.remove);
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <SimpleGrid cols={2} mt="md">
                <TextInput key={form.key('name')} {...form.getInputProps('name')} />
                <ActionIcon.Group ml="auto">
                    <CopyButton value={`https://diplom-five-khaki.vercel.app/${initialValues._id}/goal`} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Скопировано' : 'Скопировать ссылку на виджет сбора'} withArrow position="right">
                                <ActionIcon size={"lg"} variant="light" color={copied ? 'teal' : ''} onClick={copy}>
                                    {copied ? <FaCheck /> : <FaFlag />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                    <CopyButton value={`https://diplom-five-khaki.vercel.app/${initialValues._id}/alert`} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Скопировано' : 'Скопировать ссылку на виджет оповещения'} withArrow position="right">
                                <ActionIcon size={"lg"} variant="light" color={copied ? 'teal' : ''} onClick={copy}>
                                    {copied ? <FaCheck /> : <FaBell />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                    <Tooltip label="Удалить">
                        <ActionIcon variant="light" color="red" size="lg" onClick={() => deleteTarget({ id: initialValues._id })}>
                            <FaTrash />
                        </ActionIcon>
                    </Tooltip>
                </ActionIcon.Group>
                <NumberInput description="Собрано" key={form.key('collected')} {...form.getInputProps('collected')} />
                {/* <Text size="lg" >/</Text> */}
                <NumberInput description="Всего" key={form.key('total')} {...form.getInputProps('total')} />
            </SimpleGrid>

            <Radio.Group mt="md" {...form.getInputProps('goalId')}>
                <Carousel
                    slideSize="70%"
                    slideGap="xl"
                    emblaOptions={{
                        loop: true,
                        dragFree: true,
                        align: 'center'
                    }}
                >
                    {initialValues.goals.map((goal) => (
                        <Carousel.Slide key={goal._id}>
                            <Radio.Card value={goal._id} h={'100%'} className={classes.root} >
                                <GoalTemplate {...goal} name={form.values.name} collected={form.values.collected} total={form.values.total} />
                            </Radio.Card>
                        </Carousel.Slide >
                    ))}
                </Carousel>
            </Radio.Group>

            <Radio.Group mt="md" {...form.getInputProps('alertId')}>
                <Carousel
                    slideSize="70%"
                    slideGap="xl"
                    emblaOptions={{
                        loop: true,
                        dragFree: true,
                        align: 'center'
                    }}
                >
                    {initialValues.alerts.map((alert) => (
                        <Carousel.Slide key={alert._id}>
                            <Radio.Card value={alert._id} h={'100%'} className={classes.root} >
                                <AlertTemplate {...alert} name={form.values.name} message={form.values.name} amount={form.values.collected} />
                            </Radio.Card>
                        </Carousel.Slide>
                    ))}
                </Carousel>
            </Radio.Group>
        </Card >
    )
}
