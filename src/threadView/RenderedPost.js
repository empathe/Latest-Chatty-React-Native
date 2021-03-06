import { StyleSheet, Text, TouchableOpacity, View, Clipboard, Alert } from "react-native";
import * as React from "react";
import StyleConverters from "../styles/StyleConverters";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as _ from "lodash";
import WritePost from "../postViews/WritePost";
import WinchattyAPI from "../api/WinchattyAPI";
import moment from "moment";
import RichPostView from "../postViews/RichPostView";
import { observer } from "mobx-react/native";

@observer
export default class RenderedPost extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			item: this.props.item,
			showReply: false
		};
	}

	_getDynamicPaddingStyle = (depth) => {
		return { marginLeft: 6 + (15 * depth) };
	};

	_copyPostUrlToClipboard() {
		Clipboard.setString("https://www.shacknews.com/chatty?id=" + this.state.item.id + "#item_" + this.state.item.id);
		Alert.alert(
			"Copied",
			"Post url copied to clipboard",
			[
				{ text: "OK" },
			],
			{ cancelable: true }
		);
	}

	render() {
		let messageBody;
		let tenYearIcon;
		if (WinchattyAPI.isTenYearUser(this.state.item.author)) {
			tenYearIcon =
				<Icon name="flash" style={{ flex: this.state.item.isSelected ? 1 : 0, marginLeft: 2, marginTop: 2 }} size={12}
					color="rgb(255, 186, 0);" />;
		} else {
			tenYearIcon = <View style={{ flex: this.state.item.isSelected ? 1 : 0 }} />;
		}
		if (!this.state.item.isSelected) {
			let lolTags = [];
			//TODO: PureComponent won"t update lol counts.
			_.each(this.state.item.lols, (lol) => {
				lolTags.push(<View style={{
					width: 4,
					height: 16,
					marginLeft: 2,
					backgroundColor: StyleConverters.getLolTagColor(lol.tag)
				}} key={lol.tag} />);
			});
			messageBody = (
				<TouchableOpacity
					style={{
						flex: 1,
						flexDirection: "row",
						padding: 6,
						alignItems: "center"
					}}
					onPress={async () => await this.props.selectPost(this.state.item.id)}>
					<View style={[this._getDynamicPaddingStyle(this.state.item.depth), { flex: 0 }]} />
					<Text numberOfLines={1}
						style={{
							flex: 1,
							color: this.state.item.isRead ? "gray" : "lightgray"
						}}>{this.state.item.preview}</Text>
					<Text numberOfLines={1}
						style={[StyleConverters.getAuthorTextStyle(this.state.item.author), { flex: 0 }]}>{this.state.item.author}</Text>
					{tenYearIcon}
					<View style={{ flex: 0, flexDirection: "row" }}>{lolTags}</View>
				</TouchableOpacity>);
		} else {
			let lolTags = [];
			_.each(this.state.item.lols, (lol) => {
				const text = lol.count + " " + lol.tag + "s";
				lolTags.push(<Text key={text}
					style={[StyleConverters.getLolTagStyle(lol.tag), { paddingRight: 6 }]}>{text}</Text>);
			});
			let replyArea, selectedButtonStyle;
			if (this.state.showReply) {
				selectedButtonStyle = {
					backgroundColor: StyleConverters.getAccentColor()
				};
				replyArea = (
					<View>
						<View style={{
							height: 1,
							marginLeft: 12,
							marginTop: 6,
							marginRight: 12,
							marginBottom: 4,
							backgroundColor: "lightgray"
						}} />
						<WritePost
							onSubmit={async (text, onFinished) => {
								await WinchattyAPI.postComment(this.state.item.id, text);
								onFinished();
								this.setState({ showReply: false });
							}}
							onReplyContentSizeChanged={this.props.onReplyContentSizeChanged}
						/>
					</View>);
			}
			messageBody = (
				<View style={{ padding: 6 }}>
					<View style={{
						flex: 1,
						flexDirection: "row",
						justifyContent: "space-between"
					}}>
						<View style={[this._getDynamicPaddingStyle(this.state.item.depth), { flex: 0 }]} />
						<Text numberOfLines={1}
							style={[StyleConverters.getAuthorTextStyle(this.state.item.author), { flex: 0 }]}>{this.state.item.author}</Text>
						{tenYearIcon}
						<Text
							style={[styles.dateText, { flex: 0 }]}>{moment(this.state.item.date).format("MMM Do, YYYY h:MM A")}</Text>
					</View>
					<View style={[{
						height: 4,
						marginLeft: 6,
						marginTop: 4,
						marginRight: 6,
						marginBottom: 4
					}, StyleConverters.getThreadTagStyle(this.state.item.category)]} />
					<RichPostView text={this.state.item.body}
						onHyperlinkClicked={(uri) => {
							this.props.navigation.navigate("BrowserView", { uri: uri });
						}} />
					<View style={{
						flex: 1,
						flexDirection: "row",
						justifyContent: "space-between"
					}}>
						<View style={{ flex: 1, flexDirection: "row", paddingTop: 4 }}>{lolTags}</View>
						<View style={{ flex: 0, flexDirection: "row" }}>
							<Icon name="account-outline" style={styles.inlineButton} />
							<Icon name="link"
								style={styles.inlineButton}
								onPress={() => this._copyPostUrlToClipboard()} />
							<Icon name="tag-outline"
								style={styles.inlineButton}
								onPress={() => this.props.onTagButtonPressed(this.state.item.id)} />
							<Icon name="comment-outline"
								style={[styles.inlineButton, selectedButtonStyle]}
								onPress={() => this.setState({ showReply: !this.state.showReply })} />
						</View>
					</View>
					{replyArea}
				</View>
			);
		}
		return messageBody;
	}
}

const styles = StyleSheet.create({
	dateText: {
		color: "lightgray",
	},
	inlineButton: {
		color: "white",
		fontSize: 30,
		padding: 6,
		backgroundColor: "transparent"
	}
});