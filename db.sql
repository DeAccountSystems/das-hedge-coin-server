/*
 Navicat Premium Data Transfer

 Source Server         : das-hedge-coin-server
 Source Server Type    : MySQL
 Source Server Version : 50616
 Source Host           : 127.0.0.1:3306
 Source Schema         : test

 Target Server Type    : MySQL
 Target Server Version : 50616
 File Encoding         : 65001

 Date: 06/07/2021 10:56:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_order_list
-- ----------------------------
DROP TABLE IF EXISTS `t_order_list`;
CREATE TABLE `t_order_list` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `order_id` varchar(64) NOT NULL DEFAULT '' COMMENT 'order ID',
  `pay_token_id` varchar(255) NOT NULL DEFAULT '' COMMENT 'payment token ID',
  `pay_amount` decimal(60,18) NOT NULL COMMENT 'payment amount',
  `to_usdt` decimal(60,8) DEFAULT NULL COMMENT 'number of tokens converted to equivalent USDT',
  `to_usdt_at` datetime(6) DEFAULT NULL COMMENT 'date of order conversion to USDT',
  `to_usdt_order_id` varchar(255) DEFAULT '' COMMENT 'orders converted to USDT order ID',
  `to_ckb` decimal(60,8) DEFAULT NULL COMMENT 'number of tokens converted to equivalent CKB',
  `to_ckb_at` datetime(6) DEFAULT NULL COMMENT 'data of order conversion to CKB',
  `to_ckb_order_id` varchar(255) DEFAULT '' COMMENT 'order conversion to CKB order ID',
  `created_at` datetime(6) NOT NULL COMMENT 'order creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=18051 DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
