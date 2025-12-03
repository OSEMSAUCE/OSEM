<script lang="ts">
	import { Button } from '$lib/subwoof/components/ui/button';
	import { Input } from '$lib/subwoof/components/ui/input';
	import * as Card from '$lib/subwoof/components/ui/card';
	import { Badge } from '$lib/subwoof/components/ui/badge';
	import { Separator } from '$lib/subwoof/components/ui/separator';
	import { Textarea } from '$lib/subwoof/components/ui/textarea';
	import * as Accordion from '$lib/subwoof/components/ui/accordion';
	import * as Tabs from '$lib/subwoof/components/ui/tabs';
	import * as Table from '$lib/subwoof/components/ui/table';
	import * as DropdownMenu from '$lib/subwoof/components/ui/dropdown-menu';
</script>

<div class="p-10 space-y-8 border-t-4 mt-10">
	<h2 class="text-2xl font-bold">Border Control Test Zone</h2>
	<p class="text-muted-foreground">
		All components below share the exact same border color defined in app.css
	</p>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<!-- 1. Input -->
		<div class="space-y-2">
			<h3 class="font-semibold">Input</h3>
			<Input placeholder="I have the global border color" />
		</div>

		<!-- 2. Outline Button -->
		<div class="space-y-2">
			<h3 class="font-semibold">Outline Button</h3>
			<Button variant="outline" class="w-full">I have the global border color</Button>
		</div>

		<!-- 3. Card -->
		<div class="space-y-2">
			<h3 class="font-semibold">Card</h3>
			<Card.Root>
				<Card.Content class="pt-6">I have the global border color</Card.Content>
			</Card.Root>
		</div>

		<!-- 4. Outline Badge -->
		<div class="space-y-2">
			<h3 class="font-semibold">Outline Badge</h3>
			<Badge variant="outline" class="text-lg py-1 px-4">I have the global border color</Badge>
		</div>

		<!-- 5. Separator (Pure Border) -->
		<div class="space-y-2">
			<h3 class="font-semibold">Separator</h3>
			<div class="h-12 flex items-center justify-center border rounded-md">
				<Separator orientation="horizontal" />
			</div>
		</div>

		<!-- 6. Textarea -->
		<div class="space-y-2">
			<h3 class="font-semibold">Textarea</h3>
			<Textarea placeholder="I use --color-input" />
		</div>

		<!-- 7. Accordion -->
		<div class="space-y-2">
			<h3 class="font-semibold">Accordion</h3>
			<Accordion.Root type="single" class="w-full border rounded-md">
				<Accordion.Item value="item-1" class="border-b">
					<Accordion.Trigger class="px-4">Is it accessible?</Accordion.Trigger>
					<Accordion.Content class="px-4"
						>Yes. It adheres to the WAI-ARIA design pattern.</Accordion.Content
					>
				</Accordion.Item>
				<Accordion.Item value="item-2" class="border-none">
					<Accordion.Trigger class="px-4">Is it styled?</Accordion.Trigger>
					<Accordion.Content class="px-4"
						>Yes. It comes with default styles that match the other components' aesthetic.</Accordion.Content
					>
				</Accordion.Item>
			</Accordion.Root>
		</div>

		<!-- 8. Tabs -->
		<div class="space-y-2">
			<h3 class="font-semibold">Tabs</h3>
			<Tabs.Root value="account" class="w-full border rounded-md p-4">
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="account">Account</Tabs.Trigger>
					<Tabs.Trigger value="password">Password</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">Make changes to your account here.</Tabs.Content>
				<Tabs.Content value="password">Change your password here.</Tabs.Content>
			</Tabs.Root>
		</div>

		<!-- 9. Table -->
		<div class="col-span-full space-y-2">
			<h3 class="font-semibold">Table</h3>
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-[100px]">Invoice</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head class="text-right">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell class="font-medium">INV001</Table.Cell>
							<Table.Cell>Paid</Table.Cell>
							<Table.Cell>Credit Card</Table.Cell>
							<Table.Cell class="text-right">$250.00</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</div>
		</div>
		<!-- 10. Dropdown Menu -->
		<div class="space-y-2">
			<h3 class="font-semibold">Dropdown Menu</h3>
			<div class="flex items-center justify-center">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline">Open Menu</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>Profile</DropdownMenu.Item>
							<DropdownMenu.Item>Billing</DropdownMenu.Item>
							<DropdownMenu.Item>Team</DropdownMenu.Item>
							<DropdownMenu.Item>Subscription</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>
</div>
