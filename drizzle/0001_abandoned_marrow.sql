CREATE TABLE `dataSources` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`type` enum('document','image','video','audio','other') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` varchar(64),
	`mimeType` varchar(128),
	`uploadedBy` varchar(64) NOT NULL,
	`department` varchar(128),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeItems` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`category` varchar(128),
	`tags` text,
	`knowledgeType` enum('rag','sft','pretrain','multimodal') NOT NULL,
	`status` enum('draft','reviewed','published') NOT NULL DEFAULT 'draft',
	`createdBy` varchar(64) NOT NULL,
	`reviewedBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `knowledgeItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processingTasks` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`taskType` enum('ocr','asr','extraction','segmentation','qa_generation','summarization') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` varchar(10) DEFAULT '0',
	`result` text,
	`errorMessage` text,
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `processingTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaPairs` (
	`id` varchar(64) NOT NULL,
	`knowledgeId` varchar(64) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`status` enum('draft','reviewed','published') NOT NULL DEFAULT 'draft',
	`createdBy` varchar(64) NOT NULL,
	`reviewedBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `qaPairs_id` PRIMARY KEY(`id`)
);
